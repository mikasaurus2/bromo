/*
 * Test file to create a basic server with express.
 *
 *
 *
 *
 */

"use strict"


// ========== MODULES ============
var express        = require('express'); // application framework
var cookieParser   = require('cookie-parser'); // parsing cookies header
var bodyParser     = require('body-parser'); // parse HTTP body
var mongoose       = require('mongoose'); // ORM layer on top of mongoDB
var jwt            = require('jsonwebtoken'); // JSON web tokens for user authentication

var config         = require('./config/config.js'); // load our configuration file
var routeStatic    = require('./app/router/static_router.js'); // router for static pages
var routeView      = require('./app/router/view_router.js'); // router for private html pages (and js and css)
var routeSearchApi = require('./app/router/api_search_router.js'); // router for search api paths
var routePlaylistApi = require('./app/router/api_playlist_router.js'); // router for playlist api paths
var routePlayitemApi = require('./app/router/api_playitem_router.js'); // router for playitem api paths

var app = express();

var routeUserAuthApi = require('./app/router/api_userauth_router.js')(app); // router for user auth api
var routeAuth        = require('./app/router/auth_router.js')(app); // router for authentication



// ========== CONFIG ============
if (!config) {
  console.error('[CONFIG] FAILED INITIALIZING CONFIGURATION');
  process.exit();
}

// set a variable in our app containing the web token secret
app.set('jwtSecret', config.jwtSecret);

// disable this header returned to requests; for security, we don't need
// to inform requests that we're using express
app.disable('x-powered-by');


// ========== SERVER ============
// start the server listening on port based on config parameter
var server = app.listen(config.port, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("We have started our app on http://%s:%s", host, port);
});


// ========== REGISTER ROUTES AND MIDDLEWARE ============
// register cookieParser
app.use(cookieParser());

// register bodyParser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// register routers; order is important!
app.use(routeStatic);
app.use('/api', routeUserAuthApi);
// NB: every app.use() call after this routeAuth one will require token authentication
app.use(routeAuth);
app.use(routeView);
app.use('/api', routeSearchApi);
app.use('/api', routePlaylistApi);
app.use('/api', routePlayitemApi);


// ========== DB CONNECTION ============
mongoose.connect(config.mongoDatabase, function(err) {
  if (err) {
    console.error('[MONGODB] Failed to connect: ' + err);
    process.exit();
  } else {
    console.error('[MONGODB] Connection established');
  }
});


// ========== CHAT ============
// for basic chat program
var io = require('socket.io').listen(server);


// listen on the connection event for incoming sockets
io.on('connection', function(socket) {
  console.log("A user connected");
  // sockets also fire a disconnect event; listen for those too
  socket.on('disconnect', function() {
    console.log("A user disconnected");
  });

  // sockets can fire "chat message" from clients sending messages
  socket.on('chat message', function(msg) {
    // server received the message; print it out
    console.log("message: " + msg);
    // we also want to send this message to everyone else in the chat;
    // we'll have to update client side to catch this emission
    io.emit('chat message', msg);
  });
});

















