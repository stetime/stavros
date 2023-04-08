import { Schema, model } from 'mongoose'

export const NameSchema = new Schema({
  body: String,
})

const Name = model('Name', NameSchema)
export default Name
