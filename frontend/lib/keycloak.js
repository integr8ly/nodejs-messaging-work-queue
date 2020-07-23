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
    // Keycloak 7.4 seems to have appended a trailing slash to this value which upsets keycloak-connect,
    // this removes any trailing slashes
    KEYCLOAK_CONFIG['auth-server-url'] = KEYCLOAK_CONFIG['auth-server-url'].replace(/\/*$/, "")
    kcInstance = new Keycloak({ store }, KEYCLOAK_CONFIG)
  }

  return kcInstance
}
