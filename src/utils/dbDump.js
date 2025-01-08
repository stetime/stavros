import { mongo } from "../integrations/mongo.js"
import fs from 'fs/promises'


async function dumpFeeds() {
  const feeds = await mongo.getFeeds()
  const jsonString = JSON.stringify(feeds, null, 2)
  await fs.writeFile('feeds.json', jsonString, 'utf-8')
}

async function dumpGames() {
  const games = await mongo.getGames()
  const jsonString = JSON.stringify(games, null, 2)
  await fs.writeFile('games.json', jsonString, 'utf-8')
}

async function dumpNames() {
  const names = await mongo.getNames()
  const jsonString = JSON.stringify(names, null, 2)
  await fs.writeFile('names.json', jsonString, 'utf-8')
}

async function dumpPrefixes() {
  const prefixes = await mongo.getPrefixes()
  const jsonString = JSON.stringify(prefixes, null, 2)
  await fs.writeFile('prefixes.json', jsonString, 'utf-8')
}
await mongo.init()
console.log('dumping feeds')
await dumpFeeds()
console.log('dumping games')
await dumpGames()
console.log('dumping names')
await dumpNames()
console.log('dumping prefixes')
await dumpPrefixes()
await mongo.close()
process.exit(1)