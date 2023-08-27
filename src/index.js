import logger from './utils/logger.js'
import { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, Colors } from 'discord.js'
import { mongo } from './integrations/mongo.js'
import { initFeeds, checkFeeds, purgeFeed } from './rss.js'
import { gamegen, nickgen } from './generators.js'
import { readdirSync } from 'fs'

const client = new Client({ intents: GatewayIntentBits.Guilds })
client.commands = new Collection()
const commandsPath = './src/commands'
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith('.js')
)
for (const file of commandFiles) {
  const { command } = await import(`./commands/${file}`)
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command)
    logger.info(`registered command: ${command.data.name}`)
  } else {
    logger.warn(`the command at ${file} has no data or execute property`)
  }
}

client.on(Events.ClientReady, async () => {
  await mongo.init()
  await initFeeds()
  logger.info('connected to discord')
  setInterval(
    checkFeeds,
    process.env.NODE_ENV === 'production' ? 3600000 : 100000,
    client
  )
  gamegen(client)
  nickgen(client)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu())
    return
  if (interaction.isStringSelectMenu()) {
    if (await purgeFeed(interaction.values[0])) {
      await interaction.update({
        content: 'successfully deleted',
        components: [],
      })
    }
    return
  }
  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) {
    logger.error(`no command matching ${interaction.commandName} was found`)
    return
  }
  try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(error)
  }
})

client.login(process.env.token)

// error handling

const adminChannel = client.channels.cache.get(process.env.adminChannel)

function createErrorEmbed(error) {
  return new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle(error.name)
    .setDescription(error.message)
}

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error}`)
  adminChannel?.send({ content: `Unhandled Rejection`, embeds: [createErrorEmbed(error)] })
}
)

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`)
  adminChannel?.send({ content: `Uncaught Exception`, embeds: [createErrorEmbed(error)] })
}
)

process.on('SIGINT', async () => {
  logger.info('received SIGINT, exiting')
  await mongo.close()
  logger.info('db connection closed')
  process.exit()
})
