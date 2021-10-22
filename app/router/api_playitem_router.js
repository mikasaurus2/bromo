/*
 * Router for playitem API.
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
  const PI_LIMIT = 100;

  // add playitem handler
  function addPlayitem(req, res, next) {
    /* params:
     *   user (from authentication)
     *   itemId
     *   title
     *   thumbnail
     *   embed
     *   duration
     *   playlistId
     */
    console.log('[API PLAYITEM] adding playitem: ' + req.body.title);

    User.findOne({
      _id: req.actor
    }, function(err, user) {
      if (err) {
        console.error('[API PLAYITEM] Error adding playitem: ' + err);
        res.status(500).json(httpErr['errServer']);
        return;
      }

      if (!user) {
        res.status(500).json(httpErr['errNoUser']);
      } else {
        // we found our user; lets create and add a playitem if possible
        let playlistId = req.body.playlistId;
        let playlist = user.playlists.id(playlistId);

        if (playlist) {
          if (playlist.playitems.length >= PI_LIMIT) {
            console.error('[API PLAYITEM] User [%s] playitem limit reached for playlist [%s]', user._id, playlist.name);
            res.status(500).json(httpErr['errLimitReached']);
            return;
          }

          let playitem = new Playitem({
            itemId: req.body.itemId,
            title: req.body.title,
            thumbnail: req.body.thumbnail,
            embed: req.body.embed,
            duration: req.body.duration
          });

          // we want to save the playitem document first so we have access to its ID
          playitem.save(function(err, savedPlayitem) {
            if (err) {
              console.error('[API PLAYITEM] Failed to create playitem: ' + err);
              res.status(500).json(httpErr['errServer']);
              return;
            }

            console.log('[API PLAYITEM] Playitem created successfully');
            // now that the playitem is created and saved, let's add it to the playlist and save the user
            playlist.playitems.push(savedPlayitem._id);

            user.save(function(err) {
              if (err) {
                console.error('[API PLAYITEM] Failed to save playitem to user\'s playlist: ' + err);
                res.status(500).json(httpErr['errServer']);
                return;
              }

              // playitem added successfully; we're all OK here
              let playitemId = String(savedPlayitem._id);
              console.log('[API PLAYITEM] Playitem added successfully: ' + savedPlayitem.title);
              res.status(200).json({playitem: {
                                      _id: playitemId,
                                      itemId: req.body.itemId,
                                      title: req.body.title,
                                      thumbnail: req.body.thumbnail,
                                      embed: req.body.embed,
                                      duration: req.body.duration},
                                    playlistId: playlistId});
            });
          });
        } else {
          // couldn't find the playlist by ID specified
          console.error('[API PLAYITEM] Specified playlist doesn\'t exist: ' + playlistId);
          res.status(500).json(httpErr['errNoPlaylist']);
        }
      }
    });

  }


  // remove playitem handler
  function removePlayitem(req, res, next) {
    /* params:
     *   user (from authentication)
     *   id
     *   playlistId
     */
    console.log('[API PLAYITEM] removing playitem: ' + req.body.id);

    User.findOne({
      _id: req.actor
    }, function(err, user) {
      if (err) {
        console.error('[API PLAYITEM] Error removing playitem: ' + err);
        res.status(500).json(httpErr['errServer']);
        return;
      }

      if (!user) {
        res.status(500).json(httpErr['errNoUser']);
      } else {
        let playlistId = req.body.playlistId;
        let playlist = user.playlists.id(playlistId);

        if (playlist) {
          // we found the playlist; remove the playitem in the playlist
          let playitemId = req.body.id;
          let playitems = playlist.playitems;
          let isFound = false;

          let playitemIndex = playitems.findIndex(function removePlayitemFromPlaylist(element, index) {
            if (element.toString() == playitemId) {
              let Playitem = playitemSchema.model;

              // mongoose lets us remove items without waiting for a response;
              // we don't care if we couldn't find the playitem since we're
              // deleting it anyway
              let query = Playitem.remove({_id: playitemId});
              query.exec();

              isFound = true;
              return true;
            } else {
              return false;
            }
          });

          if (isFound === true) {
            playitems.splice(playitemIndex, 1);

            user.save(function(err) {
              if (err) {
                console.error('[API PLAYITEM] Failed to remove playitem: ' + err);
                res.status(500).json(httpErr['errServer']);
                return;
              }

              console.log('[API PLAYITEM] Playitem removed successfully');
              res.sendStatus(200);
            });
          } else {
            // we didn't find that playitem ID
            console.error('[API PLAYITEM] Specified playitem doesn\'t exist: ' + playitemId);
            res.status(500).json(httpErr['errNoEntity']);
          }
        } else {
          // we don't have this playlist ID
          console.error('[API PLAYITEM] Specified playlist doesn\'t exist: ' + playlistId);
          res.status(500).json(httpErr['errNoPlaylist']);
        }
      }
    });

  }


  // Router method hookups
  router.post('/addPlayitem', addPlayitem);
  router.post('/removePlayitem', removePlayitem);

  return router;
})();




