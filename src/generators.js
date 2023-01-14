const Games = require('./models/game')
const Name = require('./models/name')
const Adjective = require('./models/adjective')
const { defaultName, defaultGame } = require('./utils/config')

class Game {
  constructor() {
    this.name = defaultGame
  }
  async generator() {
    const game = await Games.aggregate([{ $sample: { size: 1 } }])
    if (game.length < 1) {
      return defaultGame
    }
    this.name = game[0].body
    return this.name
  }
}

class Nick {
  constructor() {
    this.name = defaultName
  }
  async generator() {
    const adjective = await Adjective.aggregate([{ $sample: { size: 1 } }])
    const name = await Name.aggregate([{ $sample: { size: 1 } }])
    if (adjective.length < 1 || name.length < 1) {
      return 
    }
    this.name = `${adjective[0].body} ${name[0].body}`
    return this.name
  }
}

module.exports = {
  Nick,
  Game,
}
