import { db } from './integrations/db'
import { ActivityType } from 'discord.js'
import logger from './utils/logger.js'
import handleError from './utils/errorHandler.js'
import tweet from './integrations/twitter.js'


class Game {
  constructor() {
    this.name = 'Really Simple Syndication'
  }
  async generator() {
    const game = db.getGame()
    console.log(game)
    if (game.length < 1) {
      return
    }
    this.name = game
    return this.name
  }
}


class Nick {
  constructor() {
    this.name = 'Stavros'
  }
  async generator() {
    const { prefix, name } = db.getNick()
    console.log(prefix, name)
    if (prefix.length < 1 || name.length < 1) {
      return
    }
    this.name = `${prefix} ${name}`
  }
}

const randomTime = (min, max) => Math.floor(Math.random() * max + min)
const hours = (hr) => hr * (3600 * 1000)

async function nickgen(client) {
  try {
    const nick = new Nick()
    const guild = client.guilds.cache.get(process.env.guildId)
    await nick.generator()
    while (nick.name.length > 32) {
      logger.warn(
        `generated nick ${nick.name} is over the discord character limit`
      )
      const channel = client.channels.cache.get(process.env.channelId)
      channel.send(
        `tried to change nick to ${nick.name}... but it's over the discord limit...`
      )
      await nick.generator()
    }
    process.env.NODE_ENV === 'production' && tweet(nick.name)
    guild.members.me.setNickname(nick.name)
    setTimeout(nickgen, randomTime(hours(5), hours(12)), client)
  } catch (error) {
    handleError(error, client)
  }
}

async function gamegen(client) {
  try {
    const game = new Game()
    const gen = await game.generator()
    client.user.setActivity(gen, { type: ActivityType.Playing })
    setTimeout(gamegen, randomTime(hours(5), hours(12)), client)
  } catch (error) {
    handleError(error, client)
  }
}

export { gamegen, nickgen }