'use strict'

/**
 * Middleware that is used to force a login if a session or username is not set
 */
exports.ensureLoggedIn = function (req, res, next) {
  if (!req.session || !req.session.username) {
    res.redirect('/login')
  } else {
    next()
  }
}
