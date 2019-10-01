'use strict';

/*
 *
 *  Copyright 2016-2017 Red Hat, Inc, and individual contributors.
 *
 *  Licensed under the Apache License, Version 2.0 (the 'License');
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const express = require('express');
const probe = require('kube-probe');
const rhea = require('rhea');
const exphbs = require('express-handlebars');
const session = require('express-session');
const env = require('env-var')
const { resolve } = require('path')

// AMQP

const amqpHost = process.env.MESSAGING_SERVICE_HOST || 'localhost';
const amqpPort = process.env.MESSAGING_SERVICE_PORT || 5672;
const amqpUser = process.env.MESSAGING_SERVICE_USER || 'work-queue';
const amqpPassword = process.env.MESSAGING_SERVICE_PASSWORD || 'work-queue';

const id = 'frontend-nodejs-' + crypto.randomBytes(2).toString('hex');
const container = rhea.create_container({id});

let connection = null;

const requestIds = [];
const responses = {};
const workers = {};

let requestSequence = 0;

function sendRequest (message) {
    message.to = 'work-queue-requests';
    connection.send(message);
    console.log(`${id}: Sent request ${JSON.stringify(message)}`);
}

container.on('connection_open', event => {
  console.log(`${id}: Connected to AMQP messaging service at ${amqpHost}:${amqpPort}`);
  connection = event.connection;
});

const opts = {
  host: amqpHost,
  port: amqpPort,
  username: amqpUser,
  password: amqpPassword
};

container.on('error', err => {
  console.error(err);
  console.error(`Exiting worker with status 100`);
  process.exit(100);
});

console.log(`${id}: Attempting to connect to AMQP messaging service at ${amqpHost}:${amqpPort}`);
container.connect(opts);

// HTTP

const app = express();

// Required when running behind a load balancer, e.g HAProxy
app.set('trust proxy', true)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
// Expose the license.html at http[s]://[host]:[port]/licences/licenses.html
app.use('/licenses', express.static(path.join(__dirname, 'licenses')));

probe(app);

// Configure server-side rendering
app.engine('handlebars', exphbs())
app.set('views', resolve(__dirname, 'v1-server-local-sessions/views'))
app.set('view engine', 'handlebars')

app.use(session({
  secret: env.get('SESSION_SECRET', 'wow, such secret. very secure').asString(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Use secure cookies in production
    secure: env.get('NODE_ENV').asString() === 'production'
  }
}))

// Expose static assets, e.g patternfly css and images
app.use('/', express.static(path.join(__dirname, 'public')));

// Default application route. Forces a login if the user is not logged in
app.get('/', (req, res) => {
  const { username, orders } = req.session

  if (username) {
    res.render('index.handlebars', { username, orders })
  } else {
    res.render('login.handlebars')
  }
})

// Used by the login form to attach a session to the user
app.post('/login', (req, res) => {
  const { username } = req.body

  if (username && username.match(/[A-Za-z]{1,15}/)) {
    // Username is valid, attach it to the session
    req.session.username = username
    res.redirect('/')
  } else {
    // Invalid username, redirect to the login form
    res.render('login.handlebars', {
      username,
      invalid: true
    })
  }
})

app.post('/api/order', (req, res) => {
  const { product, quantity } = req.body
  const datetime = new Date().toJSON()

  console.log('order', product, quantity)

  // Lazy initialisation of orders
  req.session.orders = req.session.orders || []

  req.session.orders.push({ product, quantity, datetime })

  console.log(req.session.orders)

  res.json(req.session.orders)
});

app.post('/api/send-request', (req, resp) => {
  const message = {
    message_id: id + '/' + requestSequence++,
    application_properties: {
      uppercase: req.body.uppercase,
      reverse: req.body.reverse
    },
    body: JSON.stringify({type:req.body.text, stock: req.body.stock})
  };

  requestIds.push(message.message_id);

  sendRequest(message);

  resp.status(202).send(message.message_id);
});

app.get('/api/data', (req, resp) => {
  resp.json({requestIds, responses, workers});
});

module.exports = app;
