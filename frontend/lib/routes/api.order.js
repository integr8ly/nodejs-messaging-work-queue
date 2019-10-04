'use strict'

const log = require('../log')
const amqp = require('../amqp')
const express = require('express')
const Joi = require('@hapi/joi')
const { createValidator } = require('express-joi-validation')
const route = express.Router()
const validator = createValidator()

const schema = Joi.object({
  product: Joi.string().regex(/[A-Za-z ]{1,32}/),
  quantity: Joi.number().min(1).max(999)
})

route.post('/order', validator.body(schema), async (req, res, next) => {
  const { product, quantity } = req.body

  log.info('processing order request with body %j for user %s', req.body, req.session.username)

  const datetime = new Date().toJSON()
  const order = {
    datetime,
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
})

route.get('/order/history', (req, res) => {
  res.json(req.session.orders)
})

module.exports = route
