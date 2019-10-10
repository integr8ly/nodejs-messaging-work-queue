'use strict'

const { THREESCALE_HEADER_NAME } = require('./config')

exports.getUsernameFromRequest = (req) => {
  if (req.kauth) {
    return req.kauth.grant.access_token.content.preferred_username
  } else {
    return req.session.username
  }
}

exports.getThreescaleTokenFromRequest = (req) => {
  return req.headers[THREESCALE_HEADER_NAME]
}
