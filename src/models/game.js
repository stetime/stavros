import { Schema, model } from 'mongoose'

export const GameSchema = new Schema({
  body: String,
})

const Game = model('Game', GameSchema)
export default Game
