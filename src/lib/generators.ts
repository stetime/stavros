import { db } from "./db.js"
import { ActivityType } from "discord.js"
import type { Client } from "discord.js"
import logger from "../utils/logger.js"
import handleError from "../utils/errorHandler.js"
import tweet from "./twitter.js"

class Game {
  name: string
  constructor() {
    this.name = "Really Simple Syndication"
  }
  async generator() {
    const game = db.getGame()
    if (!game) {
      return this.name
    }
    this.name = game
    return this.name
  }
}

class Nick {
  name: string
  constructor() {
    this.name = "Stavros"
  }
  generator() {
    const result = db.getNick()
    if (!result) {
      return
    }
    const { prefix, name } = result
    this.name = `${prefix} ${name}`
  }
}

const randomTime = (min: number, max: number) =>
  Math.floor(Math.random() * max + min)
const hours = (hr: number) => hr * (3600 * 1000)

async function nickgen(client: Client) {
  try {
    const nick = new Nick()
    const guild = client.guilds.cache.get(process.env.guildId as string)
    nick.generator()
    while (nick.name.length > 32) {
      logger.warn(
        `generated nick ${nick.name} is over the discord character limit`,
      )
      const channel = client.channels.cache.get(process.env.channelId as string)
      if (channel && "send" in channel) {
        channel.send(
          `tried to change nick to ${nick.name}... but it's over the discord limit...`,
        )
      }
      nick.generator()
    }
    process.env.NODE_ENV === "production" && tweet(nick.name)
    guild?.members?.me?.setNickname(nick.name)
    setTimeout(nickgen, randomTime(hours(5), hours(12)), client)
  } catch (error) {
    handleError(error, client)
  }
}

async function gamegen(client: Client) {
  try {
    const game = new Game()
    const gen = await game.generator()
    gen && client.user?.setActivity(gen, { type: ActivityType.Playing })
    setTimeout(gamegen, randomTime(hours(5), hours(12)), client)
  } catch (error) {
    handleError(error, client)
  }
}

export { gamegen, nickgen }
