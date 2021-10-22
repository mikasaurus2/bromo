/*
 * Router for static files.
 *
 *
 */



"use strict"


var express = require('express');


module.exports = (function() {

  // create new instance of an express router
  var router = express.Router();

  // use express.static to serve static files in the public directory
  router.use(express.static(__dirname + '/../../public'));

  return router;
})();




















