/*
 * Schema and data model for a playlist
 *
 *
 */


"use strict"

// instance of mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = Schema.Types.ObjectId;


// set up the playlist schema
var playlistSchema = new Schema({
  // ID will be provided by mongo automatically

  // name
  name: { type: String, required: true },

  // if this is the user's active playlist
  active: Boolean,

  // array of playitems; use ref so we can easily populate this array with information
  // from the actual playitem schema stored in a separate collection
  playitems: [{ type: ObjectId, ref: 'Playitem' }]

});

var playlistModel =  mongoose.model('Playlist', playlistSchema);


/*
// we can create custom methods to add validations or formatting
// (other examples include: making sure passwords are hashed)
playlistSchema.methods.validateName = function() {
  // some validation logic here

};
*/

// export our playlistSchema so the User schema can embed it
module.exports.schema = playlistSchema;
module.exports.model = playlistModel;







