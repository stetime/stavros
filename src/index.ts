import logger from "./utils/logger.js"
import handleError from "./utils/errorHandler.js"
import { Client, GatewayIntentBits, Collection, Events } from "discord.js"
import { db } from "./lib/db.js"
import { initFeeds, checkFeeds, purgeFeed } from "./lib/rss.js"
import { gamegen, nickgen } from "./lib/generators.js"
import { readdirSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

declare module "discord.js" {
  interface Client {
    commands: Collection<string, any>
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})
client.commands = new Collection()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const commandsPath = join(__dirname, "commands")
const commandFiles = readdirSync(commandsPath).filter(
  (file) => file.endsWith(".js") || file.endsWith(".ts")
)
for (const file of commandFiles) {
  const { command } = await import(`./commands/${file}`)
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command)
    logger.info(`registered command: ${command.data.name}`)
  } else {
    logger.warn(`the command at ${file} has no data or execute property`)
  }
}

client.on(Events.ClientReady, async () => {
  db.init()
  initFeeds()
  logger.info("connected to discord")
  setInterval(
    checkFeeds,
    process.env.NODE_ENV === "production" ? 36000000 : 80000,
    client
  )
  gamegen(client)
  nickgen(client)
  process.env.NODE_ENV !== "production" &&
    setInterval(() => {
      logger.debug(`WebSocket ping: ${client.ws.ping}`)
      logger.debug(`WebSocket status: ${client.ws.status}`)
      logger.debug(`Client ready: ${client.isReady()}`)
      logger.debug(`Gateway URL: ${client.ws.gateway}`)
    }, 30000)
})

client.on(Events.MessageCreate, async (message) => {
  const urlRegex =
    /(https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\/[^\s]+)/g

  if (urlRegex.test(message.content)) {
    const newContent = message.content.replace(urlRegex, (url) => {
      return url.replace(/twitter\.com|x\.com/g, "fxtwitter.com")
    })

    try {
      await message.delete()
      const displayName = message.member?.displayName || message.author.username
      await message.channel.send(`${displayName}: ${newContent}`)
    } catch (error) {
      handleError(error, client)
    }
  }
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu())
    return
  if (interaction.isStringSelectMenu() && interaction.values[0]) {
    if (await purgeFeed(interaction.values[0])) {
      await interaction.update({
        content: "successfully deleted",
        components: [],
      })
    }
    return
  }
  if (!interaction.isChatInputCommand()) return
  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) {
    logger.error(`no command matching ${interaction.commandName} was found`)
    return
  }
  try {
    await command.execute(interaction)
  } catch (error) {
    handleError(error, client, interaction)
  }
})

client.login(process.env.token)

client.on(Events.ShardReady, () => {
  logger.debug(`Shard Ready`)
})

client.on(Events.ShardError, (error) => {
  handleError(error, client)
})

client.on(Events.ShardDisconnect, (event, id) => {
  logger.warn(`shard ${id} disconnected`, event)
})

client.on(Events.ShardReconnecting, (id) => {
  logger.info(`shard ${id} reconnecting`)
})

client.on(Events.Error, (error) => {
  logger.error(error)
})

process.on("unhandledRejection", (error) => {
  handleError(error, client)
})

process.on("uncaughtException", (error) => {
  handleError(error, client)
})

process.on("SIGINT", async () => {
  logger.info("received SIGINT, exiting")
  db.close()
  process.exit()
})
