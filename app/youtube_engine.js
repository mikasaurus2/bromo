/*
 * Youtube Engine module. This module interacts with the Youtube API and manipulates
 * the results we're interested in.
 *
 *  Params for GET request:
 *  part: snippet
 *  q: search string
 *  type: video
 *  fields: items(id(videoId), snippet(title, thumbnails))
 *
 *  Search API snippet will return stuff we're interested in:
 *  snippet
 *    - item.id (id of video)
 *    - snippet.title (title of search result)
 *    - snippet.thumbnails (map of thumbnail images associated with result)
 *      key is name of thumbnail; value is object that contains more info
 *        - thumbnails.key (default, medium, high)
 *        - thumbnails.key.url, .width, .height
 *
 *  GET https://www.googleapis.com/youtube/v3/search?part=snippet&q=Ylvis+-+Yoghurt+%5BOfficial+music+video+HD%5D&type=video&fields=items(id(videoId)%2Csnippet(title%2C+thumbnails))&key={YOUR_API_KEY}
 *
 */


var request = require('request');
var config  = require('../config/config.js');


function Youtube() {

  var self = this;

  // base URL for youtube API
  var youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/';
  var youtubeApiKey = config.youtubeApiKey || '';

  self.search = {

    video: function(queryString, fnCallback) {

      // create our request options
      var options = {
        url: youtubeApiUrl + 'search',
        // NB: So I originally manually used encodeURIComponent on the query string
        // and the 'fields' param as instructed by the youtube API. I ended up getting
        // an empty array response for my search, when there should have been some
        // results. Turns out we can just use the simple strings as values and the
        // request module seems to encode them later.
        qs: {
          part: 'snippet',
          q: queryString,
          type: 'video',
          maxResults: '20',
          fields: 'items(id(videoId), snippet(title, thumbnails(default(url))))',
          key: youtubeApiKey
        }
      }

      // hit the Youtube search API
      request(options, function(error, response, body) {
        if (error) {
          console.error('[YOUTUBE API] FAILED: ' + error);
          fnCallback(error);
        } else {
          // we have a response body, so lets parse it
          var data = JSON.parse(body);
          if (response.statusCode !== 200) {
            console.error('[YOUTUBE API] HTTP ERROR: %s %s', response.statusCode, body);
            fnCallback(data.error);
          } else {
            console.log('[YOUTUBE API] SUCCESS: %s', response.statusCode);
            var result = filterSearchResponse(data.items);
            fnCallback(null, result);
          }
        }
      });
    }
  };

  self.videos = {

    list: function(arrVideoIDs, fnCallback) {

      // create our request options
      var options = {
        url: youtubeApiUrl + 'videos',
        qs: {
          part: 'contentDetails, player',
          fields: 'items(id, contentDetails(duration), player)',
          id: arrVideoIDs.join(','),
          key: youtubeApiKey
        }
      };

      // hit the Youtube video API
      request(options, function(error, response, body) {
        if (error) {
          console.error('[YOUTUBE API] FAILED: ' + error);
          fnCallback(error);
        } else {
          // we have a response body, so lets parse it
          var data = JSON.parse(body);
          if (response.statusCode !== 200) {
            console.error('[YOUTUBE API] HTTP ERROR: %s %s', response.statusCode, body);
            fnCallback(data.error);
          } else {
            console.log('[YOUTUBE API] SUCCESS: %s', response.statusCode);
            var result = filterVideoResponse(data.items);
            fnCallback(null, result);
          }
        }
      });
    }
  }

  // function to filter youtube response to just the stuff we're interested in
  // (data parameter is an array)
  function filterSearchResponse(data) {

    if (!data) {
      return [];
    }

    // we want default thumbnail, video id, and title
    // object->id->videoId
    // object->snippet->title
    // object->snippet->default->url

    return data.map(function(obj) {
      var newObj = {};

      if (obj.id && obj.id.videoId) {
        newObj['itemId'] = obj.id.videoId;
      } else {
        console.error('[YOUTUBE API] Youtube didn\'t return a video ID!');
        newObj['itemId'] = '';
      }

      if (obj.snippet) {
        if (obj.snippet.title) {
          newObj['title'] = obj.snippet.title;
        } else {
          console.error('[YOUTUBE API] Youtube didn\'t return a video title!');
          newObj['title'] = '';
        }

        if (obj.snippet.thumbnails && obj.snippet.thumbnails.default && obj.snippet.thumbnails.default.url) {
          newObj['thumbnail'] = obj.snippet.thumbnails.default.url;
        } else {
          console.error('[YOUTUBE API] Youtube didn\'t return a video thumbnail!');
          newObj['thumbnail'] = '';
        }
      } else {
        console.error('[YOUTUBE API] Youtube didn\'t return a video snippet!');
      }

      return newObj;
    });

  }

  function parseDuration(duration) {
    var objDuration = {
      h: '',
      m: '',
      s: ''
    };

    // this is an ISO 8601 duration (PT#M#S or PT#H#M#S)
    if (duration.startsWith('PT') == false) {
      console.error('[YOUTUBE ENGINE] Duration string doesn\'t start with PT');
      return objDuration;
    }

    // chop off the beginning 'PT'
    var tmp = duration.slice(1);
    var regexp = /[0-9]+[HMS]/g
    // use regex to break up duration string into time parts
    var result = tmp.match(regexp);

    result.forEach(function(item) {
      var timeType = item.charAt(item.length-1);

      // extract everything up to the last letter indicator and
      // store it in the appropriate field
      if (timeType === 'H') {
        objDuration.h = item.slice(0, -1);
      } else if (timeType === 'M') {
        objDuration.m = item.slice(0, -1);
      } else if (timeType === 'S') {
        objDuration.s = item.slice(0, -1);
      }
    });

    return objDuration;
  }

  // function to filter youtube video response to just the stuff we're interested in
  // (data parameter is an array)
  function filterVideoResponse(data) {

    if (!data) {
      return [];
    }

    // we want video id, the duration, and embedding information
    // object->id
    // object->contentDetails->duration
    // object->player

    return data.map(function(obj) {
      var newObj = {};

      if (obj.id) {
        newObj['itemId'] = obj.id;
      } else {
        console.error('[YOUTUBE API] Youtube didn\'t return a video ID!');
        newObj['itemId'] = '';
      }

      if (obj.contentDetails && obj.contentDetails.duration) {
        // this is an ISO 8601 duration
        // PT#M#S or PT#H#M#S
        var objDuration = parseDuration(obj.contentDetails.duration);
        newObj['duration'] = objDuration;
      } else {
        console.error('[YOUTUBE API] Youtube didn\'t return a video duration!');
        newObj['duration'] = '';
      }

      if (obj.player) {
        newObj['player'] = obj.player;
      } else {
        console.error('[YOUTUBE API] Youtube didn\'t return video player info!');
        newObj['player'] = null;
      }

      return newObj;
    });

  }


}







module.exports = Youtube;












