const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NameSchema = new Schema({
  body: String,
})

module.exports = mongoose.model('Name', NameSchema)
