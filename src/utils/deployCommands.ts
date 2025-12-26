import { REST, Routes } from "discord.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const required = ["clientId", "guildId, token"]
for (const req of required) {
  if (!process.env[req]) {
    throw new Error(`missing required environment variable: ${req}`)
  }
}
const { clientId, guildId, token } = process.env

const commands = []
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const commandsPath = path.resolve(__dirname, "..", "commands")
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
console.log(commandFiles)

for (const file of commandFiles) {
  const { command } = await import(`../commands/${file}`)
  commands.push(command.data.toJSON())
}

const rest = new REST({ version: "10" }).setToken(token as string)

;(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    )

    const data: any = await rest.put(
      Routes.applicationGuildCommands(clientId as string, guildId as string),
      { body: commands }
    )

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    )
  } catch (error) {
    console.error(error)
  }
})()
