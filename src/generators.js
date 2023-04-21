import { mongo } from './intergrations/mongo.js'
import { ActivityType } from 'discord.js'
import logger from './utils/logger.js'
// import tweet from './intergrations/twitter.js'


class Game {
  constructor() {
    this.name = 'Really Simple Syndication'
  }
  async generator() {
    const game = await mongo.getGame()
    if (game.length < 1) {
      return
    }
    this.name = game[0].body
    return this.name
  }
}


class Nick {
  constructor() {
    this.name = 'Stavros'
  }
  async generator() {
    const { prefix, name } = await mongo.getNick()
    if (prefix.length < 1 || name.length < 1) {
      return
    }
    this.name = `${prefix[0].body} ${name[0].body}`
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
    // process.env.NODE_ENV === 'production' && tweet(nick.name)
    guild.members.me.setNickname(nick.name)
    setTimeout(nickgen, randomTime(hours(5), hours(12)), client)
  } catch (error) {
    logger.error(error)
  }
}

async function gamegen(client) {
  try {
    const game = new Game()
    const gen = await game.generator()
    client.user.setActivity(gen, { type: ActivityType.Playing })
    setTimeout(gamegen, randomTime(hours(5), hours(12)), client)
  } catch (error) {
    logger.error(error)
  }
}

export { gamegen, nickgen }