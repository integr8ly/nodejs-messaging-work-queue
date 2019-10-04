'use strict'

const assert = require('assert')
const Keycloak = require('keycloak-connect')
const log = require('./log')
const { KEYCLOAK_CONFIG } = require('./config')

let kcInstance

exports.getKeycloakInstance = function (store) {
  assert(store, 'Keycloak requires a session store instance to be provided')

  if (!kcInstance && KEYCLOAK_CONFIG) {
    log.info('Keycloak config was detected. Using keycloak for authentication')
    kcInstance = new Keycloak({ store }, KEYCLOAK_CONFIG)
  }

  return kcInstance
}
