/*
 * Module for authenticating token.
 * This should be used in middleware for any route that
 * needs token verification.
 *
 *
 */



"use strict"

var jwt  = require('jsonwebtoken');
var User = require('./schema/user_model.js');

function JwtAuth(app) {

  var self = this;

  var jwtSecret = setSecretFromApp(app);

  function setSecretFromApp(app) {
    if (!app.get('jwtSecret')) {
      console.error('[JWT AUTH] Error: App does not have jwtSecret set!');
      return null;
    } else {
      return app.get('jwtSecret');
    }
  }

  // Our main authentication method which decodes a token and checks to make
  // sure the user is in our database. Takes callbacks for success and failure.
  self.doAuthDecode = function(token, fnCbOk, fnCbErr) {
    if (token && jwtSecret) {
      // We're using an asynchronous verify() here so we don't hold up our
      // event loop while we're decoding tokens.
      jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
          console.error('[JWT AUTH] Error verifying token: ' + err);
          fnCbErr();
        } else {
          // we decoded successfully; make sure we have this user in our database
          User.findOne({
            _id: decoded._id
          }, function(err, user) {
            if (err) {
              console.error('[JWT AUTH] Error finding user: ' + err);
              fnCbErr();
            }

            // if we couldn't find the user
            if (!user) {
              console.error('[JWT AUTH] No user associated with id: ' + decoded._id);
              fnCbErr();
            } else if (user) {
              // we have the user in our database; they are authenticated
              fnCbOk(decoded);
            }
          });
        }
      });
    } else {
      console.error('[JWT AUTH] No token provided');
      // there's no token and/or secret
      fnCbErr();
    }
  };

}


module.exports = JwtAuth;





















