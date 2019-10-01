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
const bodyParser = require('body-parser');
const express = require('express');
const probe = require('kube-probe');
const exphbs = require('express-handlebars');
const session = require('express-session');
const env = require('env-var')
const { resolve } = require('path')
const amqp = require('./lib/amqp')
const log = require('./lib/log')
const { ensureLoggedIn } = require('./lib/middleware')

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

// Expose static assets, e.g patternfly and images
app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
  res.render('login.handlebars')
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

app.get('/', ensureLoggedIn, (req, res) => {
  const { username, orders } = req.session

  res.render('index.handlebars', { username, orders })
})

app.post('/api/order', ensureLoggedIn, async (req, res, next) => {
  const { product, quantity } = req.body

  log.info(`user ${req.session.username}`)

  const order = {
    message: new Date().toJSON(),
    product,
    quantity
  }

  try {
    const id = await amqp.sendMessage(JSON.stringify(order))

    // Lazy initialisation of orders
    req.session.orders = req.session.orders || []
    req.session.orders.push({ product, quantity, datetime, id })

    res.json(req.session.orders)
  } catch (ex) {
    next(ex)
  }
});

app.get('/api/order/history', ensureLoggedIn,(req, resp) => {
  res.json(req.session.orders)
});

app.use((err, req, res, next) => {
  log.error(`express encountered an error processing a request ${req.method} ${req.originalUrl}`)
  log.error(err)

  res.status(500).end('Internal Server Error')
})

module.exports = app;
