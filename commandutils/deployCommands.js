require('dotenv').config({ path: './.local_env' });
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = process.env;

const commands = [
  new SlashCommandBuilder()
    .setName('addname')
    .setDescription('Add a name to the nick generator')
    .addStringOption((el) =>
      el.setName('input').setDescription('enter a name').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('addprefix')
    .setDescription('Add a prefix to the nick generator')
    .addStringOption((el) =>
      el.setName('input').setDescription('enter a prefix').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('addgame')
    .setDescription('Add a game to the game generator')
    .addStringOption((el) =>
      el.setName('input').setDescription('enter a game').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('addfeed')
    .setDescription('add a feed url')
    .addStringOption((el) =>
      el.setName('input').setDescription('enter a feed url').setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log('registered commands'))
  .catch(console.error);
