'use strict'

const log = require('./log')
const keycloak = require('./keycloak')
const { NODE_ENV, SESSION_SECRET } = require('./config')
const session = require('express-session')

const store = new session.MemoryStore();
const keycloakInstance = keycloak.getKeycloakInstance(store)
const sessionInstance = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Use secure cookies in production
    secure: NODE_ENV === 'production'
  },
  store
})

/**
 * Returns the pre-configured session middleware instance
 */
exports.getSessionMiddleware = () => {
  return sessionInstance
}

/**
 * Returns a pre-configured keycloak instance
 */
exports.getKeycloakInstance = () => keycloakInstance
