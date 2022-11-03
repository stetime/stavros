const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GameSchema = new Schema({
  body: String,
})

module.exports = mongoose.model('Game', GameSchema)
