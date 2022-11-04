const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Collection,
  ActivityType,
  Events,
} = require('discord.js')
const rss = require('./rss')
const config = require('./utils/config')
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const { randomTime, hourToMs, sanitise, logger } = require('./utils/utils')
const { Nick, Game } = require('./generators')
const fs = require('fs')
const path = require('path')
const { TwitterApi } = require('twitter-api-v2')
const twitter = new TwitterApi(
  config.appKey,
  config.appSecret,
  config.accessToken,
  config.accessSecret
)
const mongoose = require('mongoose')
mongoose.connect(config.connectionString)
const db = mongoose.connection
client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'))

for (let file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command)
  } else {
    logger.warm(`the command at ${filePath} has no data or execute property`)
  }
}

db.on('error', console.error.bind(console, 'connection error'))
db.once('open', () => {
  logger.success('database connected')
})

const nick = new Nick()
const game = new Game()

async function tweetnick(nick) {
  await twitter.v1.tweet(nick.name)
}

async function nickgen() {
  try {
    const guild = client.guilds.cache.get(config.guildId)
    await nick.generator()
    while (nick.name.length > 32) {
      logger.warn(
        `generated nick "${nick.name}" is over discord character limit. `
      )
      await nick.generator()
      if (nick.name.length <= 32) {
        break
      }
    }
    guild.members.me.setNickname(nick.name)
    logger.debug(`generated nick: ${nick.name}`)
    process.env.NODE_ENV === 'production' && tweetnick(nick)
    setTimeout(nickgen, randomTime(hourToMs(4), hourToMs(5)))
  } catch (err) {
    logger.error(err)
  }
}

async function gamegen() {
  const gen = await game.generator()
  client.user.setActivity(gen, { type: ActivityType.Playing })
  logger.debug(`generated game: ${gen}`)
  setTimeout(gamegen, randomTime(hourToMs(2), hourToMs(5)))
}

async function broadcast() {
  try {
    for (let source of rss.sourceList) {
      if (await source.update()) {
        for (let post of source.latestPosts) {
          logger.debug(
            `source update: ${source.title} - ${post.guid || post.id}`
          )
          const channel = client.channels.cache.get(config.channelId)
          if (source.url.includes('youtube')) {
            channel.send(post.link)
          } else {
            const content = sanitise(post.content)
            const embed = new EmbedBuilder()
              .setTitle(post.title)
              .setURL('enclosure' in post ? post.enclosure.url : post.link)
              .setDescription(
                content.length > 300 ? `${content.slice(0, 300)}...` : content
              )
              .setAuthor({ name: source.title })
            source.image && embed.setThumbnail(source.image)
            channel.send({ embeds: [embed] })
          }
        }
      }
    }
  } catch (error) {
    logger.error(error)
  }
}

client.on(Events.ClientReady, async () => {
  logger.success('connected to discord')
  await rss.bootFeeds()
  setInterval(broadcast, hourToMs(config.interval))
  nickgen()
  gamegen()
  logger.debug(rss.sourceList)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) {
    logger.error(`no command matching ${interaction.commandName} was found`)
    return
  }
  try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(error)
    await interaction.reply({ content: 'cant do that pal', ephemeral: true })
  }
})

client.login(config.token)

process.on('SIGINT', () => {
  logger.fatal('received SIGINT, exiting')
  process.exit()
})
