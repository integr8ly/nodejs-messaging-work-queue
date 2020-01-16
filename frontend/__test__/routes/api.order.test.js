'use strict'

/* eslint-env mocha */

const proxyquire = require('proxyquire').noCallThru()
const supertest = require('supertest')
const sinon = require('sinon')
const assert = require('assert')

describe('Order API Routes', () => {
  let app, route, sendStub

  beforeEach(() => {
    sendStub = sinon.stub()

    // Stub out the AMQP dependency
    route = proxyquire('../../lib/routes/api.order.js', {
      '../log': {
        info: sinon.stub()
      },
      '../amqp': {
        sendMessage: sendStub
      }
    })

    // Setup a dummy express application with our route
    app = require('express')()
    app.use(require('body-parser').json())
    app.use(require('body-parser').urlencoded({ extended: false }))
    app.use(
      require('express-session')({
        secret: 'testing',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }
      })
    )
    app.use(route)
  })

  describe('POST /orders', () => {
    it('should send an order to the message queue', (done) => {
      sendStub.resolves('a-message-id')

      supertest(app)
        .post('/order')
        .send({
          product: 'engine',
          quantity: 1
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          assert.strictEqual(err, null)
          assert.strictEqual(typeof res.body[0].datetime, 'string')
          assert.strictEqual(res.body[0].product, 'engine')
          assert.strictEqual(res.body[0].quantity, 1)
          assert.strictEqual(res.body[0].id, 'a-message-id')
          done()
        })
    })
  })

})
