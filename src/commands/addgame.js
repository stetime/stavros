const { SlashCommandBuilder } = require('discord.js')
const Game = require('../models/game')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addgame')
    .setDescription('add a game to the bot')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('the game to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    if (await Game.findOne({ body: input })) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true,
      })
      return
    }
    const g = new Game({ body: input.toString() })
    await g.save()
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true,
    })
  },
}
