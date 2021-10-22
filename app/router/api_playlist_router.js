/*
 * Router for playlist API.
 *
 *
 */

"use strict"

var express = require('express');
var httpErr = require('../errors.js');
var User    = require('../schema/user_model.js');
var playlistSchema = require('../schema/playlist_schema');
var playitemSchema = require('../schema/playitem_schema');

// MIKETODO: add parameter validation

module.exports = (function() {
  // create new instance of an express router
  var router = express.Router();
  var Playlist = playlistSchema.model;
  var Playitem = playitemSchema.model;
  const PL_LIMIT = 10;

  // list playlist handler
  function listPlaylists(req, res, next) {
    /* params:
     *   user (from authentication)
     *   populatePlayitems (bool; whether playlist playitems should be full playitem objects)
     */
    console.log('[API PLAYLIST] listing playlists: ' + req.actor);

    User.findOne({
      _id: req.actor
    }, function(err, user) {
      if (err) {
        console.error('[API PLAYLIST] Error listing playlist: ' + err);
        res.status(500).json(httpErr['errServer']);
        return;
      }

      if (!user) {
        res.status(500).json(httpErr['errNoUser']);
      } else {
        // we found our user; lets get all their playlists

        // The playlists' playitems array originally has a playitem ID only. We
        // use populate() to transform these IDs into actual playitem objects
        // with all the relevant info.
        Playitem.populate(user.playlists, { path: 'playitems'}, function(err, playlists) {
          if (err) {
            console.error('[API PLAYLIST] Error populating playlist: ' + err);
            res.status(500).json(httpErr['errServer']);
            return;
          }

          res.json(playlists);
        });
      }
    });

  }

  // add playlist handler
  function addPlaylist(req, res, next) {
    /* params:
     *   user (from authentication)
     *   name
     */
    console.log('[API PLAYLIST] adding playlist: ' + req.body.name);

    User.findOne({
      _id: req.actor
    }, function(err, user) {
      if (err) {
        console.error('[API PLAYLIST] Error adding playlist: ' + err);
        res.status(500).json(httpErr['errServer']);
        return;
      }

      if (!user) {
        res.status(500).json(httpErr['errNoUser']);
      } else {
        // we found our user; lets create and add a playlist if possible
        let makeActive = false;
        if (user.playlists.length >= PL_LIMIT) {
          console.error('[API PLAYLIST] User [%s] playlist limit reached', user._id);
          res.status(500).json(httpErr['errLimitReached']);
          return;
        }

        if (user.playlists.length == 0) {
          // this is the first playlist; make it active
          makeActive = true;
        }

        // see if a playlist with that name exists
        var curPlaylist = user.playlists.find(function findPlaylistByName(element) {
          if (element.name === req.body.name) {
            return true;
          } else {
            return false;
          }
        });

        if (curPlaylist) {
          console.error('[API PLAYLIST] Playlist already exists: ' + req.body.name);
          res.status(500).json(httpErr['errDupEntity']);
          return;
        }

        var playlist = new Playlist({
          name: req.body.name,
          active: makeActive,
          playitems: []
        });

        // We could just call user.playlists.push(subdoc), but we want to create
        // the document explicitly so that we have access to its ID. We can
        // include that ID in the response assuming the save is successful.
        var subdoc = user.playlists.create(playlist);
        user.playlists.push(subdoc);

        user.save(function(err) {
          if (err) {
            console.error('[API PLAYLIST] Failed to add playlist: ' + err);
            res.status(500).json(httpErr['errServer']);
            return;
          }

          var playlistId = String(subdoc._id);
          console.log('[API PLAYLIST] Playlist added successfully: ' + playlist.name);
          res.status(200).json({_id: playlistId, name: playlist.name, active: playlist.active, playitems: []}); 
        });
      }
    });

  }

  // remove playlist handler
  function removePlaylist(req, res, next) {
    /* params:
     *   user (from authentication)
     *   id
     */
    console.log('[API PLAYLIST] removing playlist: ' + req.body.id);

    User.findOne({
      _id: req.actor
    }, function(err, user) {
      if (err) {
        console.error('[API PLAYLIST] Error removing playlist: ' + err);
        res.status(500).json(httpErr['errServer']);
        return;
      }

      if (!user) {
        res.status(500).json(httpErr['errNoUser']);
      } else {
        // we found our user; lets remove the playlist
        let id = req.body.id;
        let playlist = user.playlists.id(id);

        if (playlist) {
          // we found the playlist; remove all the playitems in the playlist
          let playitems = playlist.playitems;
          playitems.forEach(function removePlayitem(playitem) {
            let playitemId = playitem._id;
            let Playitem = playitemSchema.model;

            // mongoose lets us remove items without waiting for a response;
            // we don't care if we couldn't find the playitem since we're
            // deleting it anyway
            let query = Playitem.remove({_id: playitemId});
            query.exec();
          });

          // remove the playlist itself
          playlist.remove();

          user.save(function(err) {
            if (err) {
              console.error('[API PLAYLIST] Failed to remove playlist: ' + err);
              res.status(500).json(httpErr['errServer']);
              return;
            }

            console.log('[API PLAYLIST] Playlist removed successfully');
            res.sendStatus(200);
          });
        } else {
          // we don't have this playlist ID
          console.error('[API PLAYLIST] Specified playlist doesn\'t exist: ' + id);
          res.status(500).json(httpErr['errNoEntity']);
        }
      }
    });

  }

  function setActivePlaylist(req, res, next) {
    /* params:
     *   user (from authentication)
     *   id (playlist id)
     */
    console.log('[API PLAYLIST] setting active playlist: ' + req.body.id);

    User.findOne({
      _id: req.actor
    }, function(err, user) {
      if (err) {
        console.error('[API PLAYLIST] Error setting active playlist: ' + err);
        res.status(500).json(httpErr['errServer']);
        return;
      }

      if (!user) {
        res.status(500).json(httpErr['errNoUser']);
      } else {
        // we found our user
        let id = req.body.id;
        let playlist = user.playlists.id(id);

        if (playlist) {
          // we found the playlist; remove 'active' on any other playlist that might have it
          user.playlists.forEach(function deactivatePlaylists(element) {
            element.active = false;
          });

          playlist.active = true;

          user.save(function(err) {
            if (err) {
              console.error('[API PLAYLIST] Failed to set active playlist: ' + err);
              res.status(500).json(httpErr['errServer']);
              return;
            }

            console.log('[API PLAYLIST] Playlist set active successfully');
            res.sendStatus(200);
          });
        } else {
          // we don't have this playlist ID
          console.error('[API PLAYLIST] Specified playlist doesn\'t exist: ' + id);
          res.status(500).json(httpErr['errNoEntity']);
        }
      }
    });

  };


  // Router method hookups
  router.post('/listPlaylists', listPlaylists);
  router.post('/addPlaylist', addPlaylist);
  router.post('/removePlaylist', removePlaylist);
  router.post('/setActivePlaylist', setActivePlaylist);

  return router;
})();




