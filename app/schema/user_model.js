/*
 * Schema and data model for a user
 *
 *
 */


"use strict"

// instance of mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var playlistSchema = require('./playlist_schema');

// set up the user schema
var userSchema = new Schema({
  // ID will be provided by mongo automatically

  // username and password
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // when the user was created 
  created_at: { type: Date, default: Date.now },

  // flag indicating whether user has admin priveleges
  admin: Boolean,

  // playlists
  playlists: [playlistSchema.schema]

});

// we can use the schema 'pre' method to have operations happen
// before the object is saved (for example, timestamping)
userSchema.pre('save', function(next) {
  /*
  // get current date
  var currentDate = new Date();

  // if created_at doesn't exist, make the field
  if (!this.created_at) {
    this.created_at = currentDate;
  }
  */

  // MIKETODO: we can also hash our passwords here to make sure we don't save in cleartext

  // continue to save
  next();

});

/*
// we can create custom methods to add validations or formatting
// (other examples include: making sure passwords are hashed)
userSchema.methods.validateName = function() {
  // some validation logic here

};
*/

// create a new mongoose model and export it so other modules can use it
module.exports = mongoose.model('User', userSchema);







