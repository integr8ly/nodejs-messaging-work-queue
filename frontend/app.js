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

// AMQP

const amqpHost = process.env.MESSAGING_SERVICE_HOST || 'localhost';
const amqpPort = process.env.MESSAGING_SERVICE_PORT || 5672;
const amqpUser = process.env.MESSAGING_SERVICE_USER || 'work-queue';
const amqpPassword = process.env.MESSAGING_SERVICE_PASSWORD || 'work-queue';

const id = 'frontend-nodejs-' + crypto.randomBytes(2).toString('hex');
const container = rhea.create_container({id});

let requestSender = null;
let responseReceiver = null;
let workerUpdateReceiver = null;

const requestMessages = [];
const requestIds = [];
const responses = {};
const workers = {};
let connectionOpenedEvent;
let requestSequence = 0;

function sendRequests () {
  if (!responseReceiver) {
    openSenderAndReceiver();
    return;
  }

  while (requestSender.sendable() && requestMessages.length > 0) {
    const message = requestMessages.shift();
    message.reply_to = responseReceiver.source.address;

    requestSender.send(message);

    console.log(`${id}: Sent request ${JSON.stringify(message)}`);
  }
}

const openSenderAndReceiver = function() {
  console.log('Trying to open sender and receiver');
  requestSender = connectionOpenedEvent.connection.open_sender('work-queue/requests');
  responseReceiver = connectionOpenedEvent.connection.open_receiver({source: {dynamic: true}});
  workerUpdateReceiver = connectionOpenedEvent.connection.open_receiver('work-queue/worker-updates');
};

container.on('connection_open', event => {
  connectionOpenedEvent = event;
  console.log(`${id}: Connected to AMQP messaging service at ${amqpHost}:${amqpPort}`);
  openSenderAndReceiver()
});

container.on('sendable', () => {
  sendRequests();
});

container.on('message', event => {
  if (event.receiver === workerUpdateReceiver) {
    const update = event.message.application_properties;

    workers[update.workerId] = {
      workerId: update.workerId,
      timestamp: update.timestamp,
      requestsProcessed: update.requestsProcessed,
      processingErrors: update.processingErrors
    };

    return;
  }

  if (event.receiver === responseReceiver) {
    const response = event.message;

    console.log(`${id}: Received response ${response}`);

    responses[response.correlation_id] = {
      requestId: response.correlation_id,
      workerId: response.application_properties.workerId,
      text: response.body
    };
  }
});

const opts = {
  host: amqpHost,
  port: amqpPort,
  username: amqpUser,
  password: amqpPassword
};

container.on('error', err => {
  console.log(`${id}: ${err}`);
});

console.log(`${id}: Attempting to connect to AMQP messaging service at ${amqpHost}:${amqpPort}`);
container.connect(opts);

// HTTP

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/', express.static(path.join(__dirname, 'public')));
// Expose the license.html at http[s]://[host]:[port]/licences/licenses.html
app.use('/licenses', express.static(path.join(__dirname, 'licenses')));

app.use('/api/greeting', (request, response) => {
  const name = request.query ? request.query.name : undefined;
  response.send({content: `Hello, ${name || 'World!'}`});
});


probe(app);

app.post('/api/send-request', (req, resp) => {
  const message = {
    message_id: id + '/' + requestSequence++,
    body: JSON.stringify({type:req.body.text})
  };

  requestMessages.push(message);
  requestIds.push(message.message_id);

  sendRequests();

  resp.status(202).send(message.message_id);
});

app.get('/api/data', (req, resp) => {
  resp.json({requestIds, responses, workers});
});

module.exports = app;
