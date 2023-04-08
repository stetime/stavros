import logger from './utils/logger.js'
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js'
import { mongo } from './intergrations/mongo.js'
import { initFeeds, checkFeeds, purgeFeed } from './rss.js'
import { gamegen, nickgen } from './generators.js'
import { readdirSync } from 'fs'
process.env.NODE_ENV !== 'production' && await import('dotenv/config')

const client = new Client({ intents: GatewayIntentBits.Guilds })
client.commands = new Collection()
const commandsPath = './src/commands'
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'))
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
  setInterval(checkFeeds, 3600000, client)
  gamegen(client)
  nickgen(client)
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return
  if (interaction.isStringSelectMenu()) {
    if (await purgeFeed(interaction.values[0])) {
      await interaction.update({ content: 'successfully deleted', components: [] })
    }
    return
  }
  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) {
    logger.error(`no command matching ${interaction.commandName} was found`)
    return
  } try {
    await command.execute(interaction)
  } catch (error) {
    logger.error(error)
  }

})


client.login(process.env.token)
process.on("unhandledRejection", (err) => logger.error(`Unhandled Rejection: ${err}`))
process.on("uncaughtException", (err) => logger.error(`Uncaught Exception: ${err}`))
process.on("SIGINT", () => {
  logger.info('received SIGINT, exiting')
  process.exit()
})