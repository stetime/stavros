const Games = require('./models/game')
const Name = require('./models/name')
const Adjective = require('./models/adjective')

class Game {
  constructor() {
    this.name = ''
  }
  async generator() {
    const game = await Games.aggregate([{ $sample: { size: 1 } }])
    this.name = game[0].body
    return this.name
  }
}

class Nick {
  constructor() {
    this.name = ''
  }
  async generator() {
    const adjective = await Adjective.aggregate([{ $sample: { size: 1 } }])
    const name = await Name.aggregate([{ $sample: { size: 1 } }])
    this.name = `${adjective[0].body} ${name[0].body}`
    return this.name
  }
}

module.exports = {
  Nick,
  Game,
}
