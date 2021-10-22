/*
 * Module for errors.
 *
 *
 */



"use strict"

var httpErrors = {

  errServer     : { error: { code: 600, msg: 'errServer', msgdesc: 'Server error' }},
  errUserExists : { error: { code: 601, msg: 'errUserExists', msgdesc: 'User already exists' }},
  errUserAuth   : { error: { code: 602, msg: 'errUserAuth', msgdesc: 'User authentication failed' }},
  errNoUser     : { error: { code: 603, msg: 'errNoUser', msgdesc: 'Could not find user' }},
  errNoPlaylist : { error: { code: 604, msg: 'errNoPlaylist', msgdesc: 'Could not find playlist' }},

  errNoEntity   : { error: { code: 610, msg: 'errNoEntity', msgdesc: 'Specified object doesn\'t exist' }},
  errDupEntity  : { error: { code: 611, msg: 'errDupEntity', msgdesc: 'Specified object is a duplicate' }},

  errLimitReached : { error: { code: 620, msg: 'errLimitReached', msgdesc: 'Limit reached' }},

  // API errors
  errYoutubeAPI : { error: { code: 640, msg: 'errYoutubeAPI', msgdesc: 'Youtube API error' }}

};



module.exports = httpErrors;





















