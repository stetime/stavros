const { SlashCommandBuilder } = require('discord.js')
const Adjective = require('../models/adjective')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addprefix')
    .setDescription('add a prefix to the bot')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('the prefix to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    if (await Adjective.findOne({ body: input })) {
      await interaction.reply({
        content: `prefix ${input} is already in the db`,
        ephemeral: true,
      })
      return
    }
    const a = new Adjective({ body: input.toString() })
    await a.save()
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true,
    })
  },
}
