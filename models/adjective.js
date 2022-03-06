const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdjectiveSchema = new Schema({
    body: String
})

module.exports = mongoose.model("Adjective", AdjectiveSchema)