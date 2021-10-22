/*
 * Router which binds an authentication function to the root path.
 * In other words, every router registered after this one will have
 * its requests authenticated.
 *
 *
 */



"use strict"


var express = require('express');
var JwtAuth = require('../auth.js');

module.exports = function(app) {
  // create new instance of an express router
  var router = express.Router();

  // token authentication we use when serving private html pages
  function tokenValidate(req, res, next) {
    var jwtAuth = new JwtAuth(app);
    // we're expecting token to be in cookies right now, but later on
    // it could be in req.body or req.query
    var token = req.cookies.token;

    function tokenValidateSuccess(decoded) {
      // we have the user in our database; they are authenticated
      // save this user ID as our actor
      req.actor = decoded._id;
      // keep going to the other routes
      next();
    }

    function tokenValidateError() {
      // user was trying to navigate to a page with an invalid token
      // redirect to main page for them to log in
      console.error('[PROTECTED REQUEST] Token validation failed for %s %s', req.method, req.url);
      res.sendStatus(403);
    }

    console.log('[PROTECTED REQUEST] %s %s', req.method, req.url);
    jwtAuth.doAuthDecode(token, tokenValidateSuccess, tokenValidateError);
  }

  // authenticate the request
  router.use(tokenValidate);

  return router;
};




















