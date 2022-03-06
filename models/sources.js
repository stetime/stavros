const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SourceSchema = new Schema({
  title: String,
  url: String,
  currentGuid: String,
  image: String,
});

module.exports = mongoose.model('Source', SourceSchema);
