'use strict'

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

const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const probe = require('kube-probe')
const exphbs = require('express-handlebars')
const log = require('./lib/log')
const { getUsernameFromRequest } = require('./lib/utils')
const { getKeycloakInstance, getSessionMiddleware } = require('./lib/middleware')

const app = express()
const keycloak = getKeycloakInstance()

// Required when running behind a load balancer, e.g HAProxy
app.set('trust proxy', true)

// Add liveness/readiness probes for Kubernetes
probe(app)

// Parse incoming JSON and URL encoded body payloads
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Configure server-side rendering
app.engine('handlebars', exphbs())
app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'handlebars')

// Expose static assets, e.g patternfly css, assets, licenses
app.use('/licenses', express.static(path.join(__dirname, 'licenses')))
app.use('/', express.static(path.join(__dirname, 'public')))

// Apply session and keycloak middleware
app.use(getSessionMiddleware())

// All routes from this point forward require a user to be logged in
// Mount either keycloak, or our simple authentication strategy
if (keycloak) {
  app.use(keycloak.middleware({
    logout: '/logout'
  }))
  app.use(keycloak.protect())
} else {
  app.use(require('./lib/routes/login'))
}

// Render the homepage HTML
app.get('/', (req, res) => {
  const { orders } = req.session
  const username = getUsernameFromRequest(req)

  res.render('index.handlebars', { username, orders })
})

// Mount the /orders API endpoints
app.use('/api', require('./lib/routes/api.order'))

// Provide a friendly 404 page
// app.use((req, res) => {
//   log.warn(`404 generated. client tried to access ${req.originalUrl}`)
//   res.render('not-found.handlebars')
// })

// Log errors/exceptions to stderr and return a server error
app.use((err, req, res, next) => {
  log.error(`express encountered an error processing a request ${req.method} ${req.originalUrl}`)
  log.error(err)

  res.status(500).end('Internal Server Error')
})

module.exports = app
