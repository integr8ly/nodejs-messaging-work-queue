'use strict'

const log = require('./log')
const utils = require('./utils')
const keycloak = require('./keycloak')
const { NODE_ENV, SESSION_SECRET, THREESCALE_SECRET, THREESCALE_HEADER_NAME } = require('./config')
const session = require('express-session')
const boom = require('@hapi/boom')

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

/**
 * A middleware that checks for the presence of a 3scale shared token.
 * If the token exists the request will be validated using that.
 */
exports.threescaleApiMiddleware = () => {
  return (req, res, next) => {
    const suppliedToken = utils.getThreescaleTokenFromRequest(req)
    // Requests using 3scale API authentication can only target API routes
    const isTargetingApi = req.originalUrl.match(/^\/api/)

    if (THREESCALE_SECRET && suppliedToken) {
      log.debug(`validating request using 3scale token in header named ${THREESCALE_HEADER_NAME}`)
      if (suppliedToken === THREESCALE_SECRET  && isTargetingApi) {
        req.validatedByThreescale = true
        next()
      } else if (suppliedToken === THREESCALE_SECRET  && !isTargetingApi) {
        next(boom.forbidden('request using API key validation must target the /api/orders endpoint'))
      } else {
        next(unauthorized(`the provided ${THREESCALE_HEADER_NAME} is invalid`))
      }
    } else {
      // This middleware is not enable or client was not proxied via 3scale
      // Process request normally
      next()
    }
  }
}
