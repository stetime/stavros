import { Schema, model } from 'mongoose'

export const PrefixSchema = new Schema({
  body: String,
})

const Prefix = model('Prefix', PrefixSchema)
export default Prefix
