/*
 * Router for user authentication API.
 *
 *
 */



"use strict"


var express = require('express');
var jwt     = require('jsonwebtoken');
var User    = require('../schema/user_model.js');
var httpErr = require('../errors.js');

// MIKETODO: add parameter validation

module.exports = function(app) {
  // create new instance of an express router
  var router = express.Router();

  // When returning a token, we can either give it back in json like this:
  //     res.json({ success: true, message: 'Good to go!', token: token });
  // or we can give it back as a header while setting some options to make it more secure.
  // We want to set it in the cookie and use the 'httpOnly' flag so that the token
  // is only sent as a header during http requests and client side javascript
  // can't grab the token. (This will prevent certain cross-site scripting attacks.)
  // We can also set 'secure' so that the token will only be sent with https.
  // So, we'd return it like this:
  //     res.cookie('token', token, { httpOnly: true, secure: true });
  //     res.json({ success: true, message: 'Good to go!' });

  function createUser(req, res) {
    // create a user
    var user = new User({
      username: req.body.username,
      password: req.body.password,
      admin: false //req.body.admin
    });

    // save the user
    user.save(function(err) {
      if (err) {
        console.error('[API USER] Failed to create user: ' + err);
        // check if this is a duplicate key issue
        if (err.code === 11000) {
          res.status(500).json(httpErr['errUserExists']);
        } else {
          res.status(500).json(httpErr['errServer']);
        }
        return;
      }

      console.log('[API USER] User saved successfully');
      // let's give back a token too
      var token = jwt.sign(user, app.get('jwtSecret'));
      // MIKETODO: add secure option when we set up HTTPS
      res.cookie('token', token, { httpOnly: true });
      res.json({ success: true, message: 'Hi!' });
    });
  }

  function loginUser(req, res) {
    // find the user
    User.findOne({
      username: req.body.username
    }, function(err, user) {
      if (err) {
        console.error('[API USER] Failed to login user: ' + err);
        res.status(500).json(httpErr['errServer']);
        return;
      }

      // if we couldn't find the user
      if (!user) {
        res.status(500).json(httpErr['errUserAuth']);
      } else if (user) {
        // check if password matches
        if (user.password != req.body.password) {
          res.status(500).json(httpErr['errUserAuth']);
        } else {
          // user found and password OK
          // create a token; no expiration for now
          var token = jwt.sign(user, app.get('jwtSecret'));
          // MIKETODO: add secure option when we set up HTTPS
          res.cookie('token', token, { httpOnly: true });
          res.json({ success: true, message: 'Good to go!' });
        }
      }
    });
  }

  // router middleware; this will trigger on every request this router
  // handles
  router.use(function(req, res, next) {
    console.log('[API INVOKED] %s %s', req.method, req.url);

    // keep going to the other routes
    next();
  });

  // handle POST for createUser API
  router.post('/createUser', createUser);

  // handle POST for loginUser API
  router.post('/loginUser', loginUser);

  return router;
};




















