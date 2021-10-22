/*
 * Schema and data model for a playitem
 *
 *
 */


"use strict"

// instance of mongoose and mongoose schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// set up playitem schema
var playitemSchema = new Schema({
  // database object ID provided automatically

  // item ID (specific to service like Youtube)
  itemId: String,

  // title
  title: { type: String, required: true },

  // thumbnail location
  thumbnail: String,

  // embed information
  embed: String,

  // duration
  duration: String

});

var playitemModel = mongoose.model('Playitem', playitemSchema);

/*
// we can create custom methods to add validations or formatting
// (other examples include: making sure passwords are hashed)
playitemSchema.methods.validateName = function() {
  // some validation logic here

};
*/

// export our playitemSchema
module.exports.schema = playitemSchema;
module.exports.model = playitemModel;



