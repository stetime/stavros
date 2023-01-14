const { SlashCommandBuilder } = require('discord.js')
let { sourceList } = require('../rss')
module.exports = {
  data: new SlashCommandBuilder()
    .setName('feeds')
    .setDescription('list currently subscribed feeds'),
  async execute(interaction) {
    if (sourceList.length < 1) {
      await interaction.reply({
        content: 'there are no active feed subscriptions',
        ephemeral: true
      })
    } else {
      const results = sourceList.map((feed) => {
        return `${feed.title}: ${feed.url}`
      })
      await interaction.reply({
        content: results.join('\n'),
        ephemeral: true,
      })
    }
  }
}
