var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var SavedSchema = new Schema({
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});


var Saved = mongoose.model("Saved", SavedSchema);

module.exports = Saved;