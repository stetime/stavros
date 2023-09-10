import { mongo } from "../integrations/mongo.js"
import fs from 'fs/promises'


async function dumpFeeds() {
  await mongo.init()
  const feeds = await mongo.getFeeds()
  const jsonString = JSON.stringify(feeds, null, 2)
  await fs.writeFile('feeds.json', jsonString, 'utf-8')
}

await dumpFeeds()
await mongo.close()
process.exit(1)