'use strict'

const { LOG_LEVEL: level } = require('./config')

module.exports = require('pino')({ level })
