'use strict'

const env = require('env-var')

const level = env.get('LOG_LEVEL', 'debug').asEnum(['trace', 'debug', 'info'])

module.exports = require('pino')({ level })
