'use strict'

const rhea = require('rhea');
const crypto = require('crypto');
const log = require('./log')

const amqpHost = process.env.MESSAGING_SERVICE_HOST || 'localhost';
const amqpPort = process.env.MESSAGING_SERVICE_PORT || 5672;
const amqpUser = process.env.MESSAGING_SERVICE_USER || 'work-queue';
const amqpPassword = process.env.MESSAGING_SERVICE_PASSWORD || 'work-queue';
const id = 'frontend-nodejs-' + crypto.randomBytes(2).toString('hex');

let requestSequence = 0;
const container = rhea.create_container({id});

container.on('connection_open', event => {
  log.info(`${id}: Connected to AMQP messaging service at ${amqpHost}:${amqpPort}`);
  connection = event.connection;
});

const opts = {
  host: amqpHost,
  port: amqpPort,
  username: amqpUser,
  password: amqpPassword
};

container.on('error', err => {
  log.error(err);
  log.error(`Exiting worker with status 100`);
  process.exit(100);
});

log.info(`${id}: Attempting to connect to AMQP messaging service at ${amqpHost}:${amqpPort}`);
container.connect(opts);

/**
 * Send a message to the queue
 * @param {String} body
 */
exports.sendMessage = function (body) {
  const message = {
    to: 'work-queue-requests',
    message_id: id + '/' + requestSequence++,
    application_properties: {
      uppercase: req.body.uppercase,
      reverse: req.body.reverse
    },
    body
  };


  if (!connection) {
    log.warn(`${id}: AMQP is not connected but an attempt was made to send a message`)
    return Promise.reject(new Error('AMQP connection is not ready/available'))
  } else {
    log.info(`${id}: Sending request ${JSON.stringify(message)}`);

    connection.send(message);

    return Promise.resolve(message.message_id)
  }

}
