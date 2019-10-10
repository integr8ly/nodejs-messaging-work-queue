'use strict'

const env = require('env-var')

module.exports = {
  AMQP: {
    HOST: env.get('MESSAGING_SERVICE_HOST', 'localhost').asString(),
    PORT: env.get('MESSAGING_SERVICE_PORT', 5672).asPortNumber(),
    USER: env.get('MESSAGING_SERVICE_USER', 'work-queue').asString(),
    PASSWORD: env.get('MESSAGING_SERVICE_PASSWORD', 'work-queue').asString()
  },
  THREESCALE_HEADER_NAME: env.get('THREESCALE_HEADER_NAME', 'x-3scale-proxy-secret-token').asString(),
  THREESCALE_SECRET: env.get('THREESCALE_SECRET').asString(),
  KEYCLOAK_CONFIG: env.get('KEYCLOAK_CONFIG').asJsonObject(),
  SESSION_SECRET: env.get('SESSION_SECRET', 'such secret. very secure. wow').asString(),
  NODE_ENV: env.get('NODE_ENV').asString(),
  LOG_LEVEL: env.get('LOG_LEVEL', 'debug').asEnum(['trace', 'debug', 'info'])
}
