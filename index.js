process.env.NODE_ENV !== 'production' &&
  require('dotenv').config({ path: `./.local_env` })
const { Client, Intents, MessageEmbed } = require('discord.js')
const { Feed, inputSingleFeed } = require('./rss')
const { token, guildId, channelId } = process.env
const embed = new MessageEmbed()
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
const { randomTime, hourToMs, sanitise } = require('./utils')
const { Nick, Game } = require('./generators')
const { addName, addPrefix, addGame, addFeed } = require('./commands')
const Source = require('./models/sources')
const { TwitterApi } = require('twitter-api-v2')
const userClient = new TwitterApi(
  ({ appKey, appSecret, accessToken, accessSecret } = process.env)
)
const { logger } = require('./logger')
const mongoose = require('mongoose')
const { connectionString } = process.env
mongoose.connect(connectionString)
const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error'))
db.once('open', () => {
  logger.info('database connected')
})

const nick = new Nick()
const game = new Game()
const sourceList = []

async function tweetnick(nick) {
  await userClient.v1.tweet(nick.name)
}

async function bootFeeds() {
  const sources = await Source.find({})
  sources.forEach((source) => {
    let { id, title, url, currentGuid, image } = source
    const feed = new Feed(id, title, url, currentGuid, image)
    sourceList.push(feed)
  })
}

async function nickgen() {
  try {
    const guild = client.guilds.cache.get(guildId)
    await nick.generator()
    while (nick.name.length > 32) {
      logger.info(`generated nick "${nick.name}" is over discord limit. `)
      await nick.generator()
      if (nick.name.length <= 32) {
        break
      }
    }
    guild.me.setNickname(nick.name)
    logger.info(`generated nick: ${nick.name}`)
    process.env.NODE_ENV === 'production' && tweetnick(nick)
    setTimeout(nickgen, randomTime(hourToMs(4), hourToMs(5)))
  } catch (err) {
    logger.error(err)
  }
}

async function gamegen() {
  const gen = await game.generator()
  client.user.setActivity(gen, { type: 'PLAYING' })
  logger.info(`generated game: ${gen}`)
  setTimeout(gamegen, randomTime(hourToMs(2), hourToMs(5)))
}

// using for of instead of forEach because these have to be sequential.

async function broadcast() {
  try {
    for (source of sourceList) {
      if (await source.update()) {
        for (ep of source.currentEp) {
          logger.info(`source update: ${source.title} - ${ep.title}`)
          const channel = client.channels.cache.get(channelId)
          if (source.url.includes(`youtube`)) {
            channel.send(ep.link)
          } else {
            const content = sanitise(ep.content)
            embed.setTitle(ep.title)
            embed.setURL('enclosure' in ep ? ep.enclosure.url : ep.link)
            embed.setThumbnail(source.image)
            embed.setDescription(
              content.length > 300 ? `${content.slice(0, 300)}...` : content
            )
            embed.setAuthor({ name: source.title })
            channel.send({ embeds: [embed] })
          }
        }
      }
    }
  } catch (error) {
    logger.error(error.message)
  }
}

client.on('ready', async () => {
  logger.info('connected to discord')
  await bootFeeds()
  const interval = process.env.NODE_ENV === 'production' ? 1 : 0.1
  setInterval(broadcast, hourToMs(interval))
  nickgen()
  gamegen()
  logger.debug(sourceList)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) {
    return
  }

  const { commandName } = interaction
  if (commandName === 'addname') {
    const name = await interaction.options.getString('input')
    ;(await addName(name))
      ? await interaction.reply(`added name: ${name} to the db`)
      : await interaction.reply(`the name ${name} already exists in the db`)
  }
  if (commandName === 'addprefix') {
    const prefix = await interaction.options.getString('input')
    ;(await addPrefix(prefix))
      ? await interaction.reply(`added prefix: ${prefix} to the db`)
      : await interaction.reply(`the prefix ${prefix} already exists`)
  }
  if (commandName === 'addgame') {
    const game = await interaction.options.getString('input')
    ;(await addGame(game))
      ? await interaction.reply(`added ${game} to the db`)
      : await interaction.reply(`${game} is already in the db`)
  }
  if (commandName === 'addfeed') {
    try {
      const feed = await interaction.options.getString('input')
      const input = await addFeed(feed)
      const parsedInput = await inputSingleFeed(input)
      if (parsedInput) {
        sourceList.push(parsedInput)
        await interaction.reply(`added ${parsedInput.title} to the db`)
        logger.info(`added feed url ${parsedInput.title}`)
        logger.debug(sourceList)
      } else {
        await interaction.reply(`bad feed or dupe.`)
      }
    } catch (error) {
      logger.error(error.message)
      await interaction.reply(`that doesn't work for me brother`)
    }
  }
})

process.on('SIGINT', () => {
  logger.info('received SIGINT, exiting')
  process.exit()
})

client.login(token)
