'use strict'

const express = require('express')
const { json } = require('body-parser')
const log = require('../log')
const route = module.exports = express.Router()

route.use(json())

route.get('/login', (req, res) => {
  res.render('login.handlebars')
})

route.post('/login', (req, res) => {
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

route.use((req, res, next) => {
  if (req.validatedByThreescale) {
    next()
  } else if (!req.session || !req.session.username) {
    log.trace(`no session or username detected, redirecting from ${req.originalUrl} to /login`)
    res.redirect('/login')
  } else {
    log.trace('request had a username, continuing with processing')
    next()
  }
})

route.use('/logout', (req, res) => {
  req.session.username = undefined
  req.session.orders = undefined

  res.redirect('/login')
})
