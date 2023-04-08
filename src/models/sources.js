import { Schema, model } from 'mongoose'

export const SourceSchema = new Schema({
  title: String,
  url: String,
  image: String,
  latestPost: {
    pubDate: Date,
    guid: String,
  },
})

const Source = model('Source', SourceSchema)
export default Source
