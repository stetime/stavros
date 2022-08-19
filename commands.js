const Games = require('./models/game')
const Name = require('./models/name')
const Adjective = require('./models/adjective')

async function addName(nick) {
  if (await Name.findOne({ body: nick })) {
    return
  }
  const n = new Name({
    body: nick.toString(),
  })
  await n.save()
  return true
}

async function addPrefix(prefix) {
  if (await Adjective.findOne({ body: prefix })) {
    return
  }
  const p = new Adjective({
    body: prefix.toString(),
  })
  await p.save()
  return true
}

async function addGame(game) {
  if (await Games.findOne({ body: game })) {
    return
  }
  const g = new Games({
    body: game.toString(),
  })
  await g.save()
  return true
}

async function addFeed(url) {
  return url.toString()
}

module.exports = {
  addGame,
  addFeed,
  addName,
  addPrefix,
}
