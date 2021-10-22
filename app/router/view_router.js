/*
 * Router for private html views.
 *
 *
 */



"use strict"


var express = require('express');

module.exports = (function() {

  // create new instance of an express router
  var router = express.Router();

  // use express.static to serve static files in the view directory
  router.use(express.static(__dirname + '/../../view'));

  return router;
})();




















