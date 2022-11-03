const { SlashCommandBuilder } = require('discord.js')
const Name = require('../models/name')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addname')
    .setDescription('add a name to the bot')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('the name to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    if (await Name.findOne({ body: input })) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true,
      })
      return
    }
    const n = new Name({ body: input.toString() })
    await n.save()
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true,
    })
  },
}
