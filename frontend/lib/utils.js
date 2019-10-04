'use strict'

exports.getUsernameFromRequest = (req) => {
  if (req.kauth) {
    return req.kauth.grant.access_token.content.preferred_username
  } else {
    return req.session.username
  }
}
