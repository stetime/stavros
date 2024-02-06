import mongoose from 'mongoose'
import Source from '../models/sources.js'
import Game from '../models/game.js'
import Name from '../models/name.js'
import Prefix from '../models/prefix.js'
import logger from '../utils/logger.js'

export const mongo = {
  async init() {
    try {
      await mongoose.connect(process.env.connectionString)
      logger.info('database connected')
    } catch (error) {
      logger.error(error.message)
      logger.info('attempting to reconnect in 5s')
      setTimeout(await mongo.init(), 5000)
    }
  },

  async getFeeds() {
    const feeds = await Source.find({})
    return feeds
  },

  async getFeed(url) {
    const feed = await Source.findOne({ url: url })
    return feed
  },

  async addFeed(url, feed, image) {
    await new Source({
      url: url,
      title: feed.title,
      image: image
    }).save()
  },

  async updateFeed(feedId, date, guid) {
    await Source.findByIdAndUpdate(feedId, {
      latestPost: {
        pubDate: date,
        guid: guid,
      }
    })
  },

  async updateUrl(feedId, url) {
    await Source.findByIdAndUpdate(feedId, {
      url: url
    })
  },

  async purgeFeed(id) {
    const result = await Source.findByIdAndDelete(id)
    return result
  },

  async getGame() {
    const game = await Game.aggregate([{ $sample: { size: 1 } }])
    return game
  },

  async getNick() {
    const prefix = await Prefix.aggregate([{ $sample: { size: 1 } }])
    const name = await Name.aggregate([{ $sample: { size: 1 } }])
    return { prefix, name }
  },

  async findPrefix(searchTerm) {
    const prefix = await Prefix.findOne({ body: searchTerm })
    return prefix
  },

  async findName(searchTerm) {
    const name = await Name.findOne({ body: searchTerm })
    return name
  },

  async findGame(searchTerm) {
    const game = await Game.findOne({ body: searchTerm })
    return game
  },

  async addPrefix(prefix) {
    const p = new Prefix({ body: prefix })
    await p.save()
  },

  async addName(name) {
    const n = new Name({ body: name })
    await n.save()
  },

  async addGame(game) {
    const g = new Game({ body: game })
    await g.save()
  },

  async close() {
    await mongoose.connection.close()
    logger.info('database disconnected')
  }
}