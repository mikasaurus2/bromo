/*
 * Configuration file
 *
 *
 */


// MIKETODO: document config options in data structure; use the structure to enforce
// optional and required parameters

var fs = require('fs');

var config = (function() {
  // Synchronous file read for initialization is required since we need values to proceed.
  // (And its ok because this happens just once during startup, so we're not in danger
  // of slowing down our event loop during requests.)
  var params = null;
  try {
    // read from config file
    console.log('Parsing config');
    params = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  } catch (error) {
    console.error(error);
  }

  return params;
})();



module.exports = config;


