import 'dotenv/config'
import { REST, Routes } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const { clientId, guildId, token } = process.env

console.log(clientId, guildId, token)

const commands = []
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const commandsPath = path.resolve(__dirname, '..', 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
console.log(commandFiles)

for (const file of commandFiles) {
  const { command } = await import(`../commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();