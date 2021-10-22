/*
 * Router for search API.
 *
 *
 */



"use strict"


var express = require('express');
var httpErr = require('../errors.js');
var Youtube = require('../youtube_engine.js');

// MIKETODO: add parameter validation

module.exports = (function() {
  // create new instance of an express router
  var router = express.Router();

  // youtube search handler
  function searchYoutube(req, res, next) {
    console.log('[API YOUTUBE SEARCH] searching youtube: ' + req.body.searchString);
    var youtube = new Youtube();
    youtube.search.video(req.body.searchString, function(error, searchData) {
      if (error) {
        console.error('[API YOUTUBE SEARCH] youtube search failed: ' + error);
        res.status(500).json(httpErr['errYoutubeAPI']);
      } else {
        console.log('[API YOUTUBE SEARCH] youtube search successful');
        // we got our search results of videos, but now we have to get the specific
        // video resources to get more information about them
        var arrVideoIDs = searchData.map(function(obj) {
          return obj.itemId;
        });
        youtube.videos.list(arrVideoIDs, function(error, videoData) {
          if (error) {
            console.error('[API YOUTUBE VIDEOS] youtube videos list failed: ' + error);
            res.status(500).json(httpErr['errYoutubeAPI']);
          } else {
            console.log('[API YOUTUBE VIDEOS] youtube videos list successful');

            // merge the data in the two responses to make it easier to use
            for (var i = 0; i < videoData.length; i++) {
              searchData[i]['duration'] = videoData[i].duration;
              searchData[i]['player'] = videoData[i].player;
            }

            // return json data
            res.json(searchData);
          }
        });
      }
    });
  }

  // Router method hookups

  // handle POST for createUser API
  router.post('/searchYoutube', searchYoutube);

  return router;
})();




