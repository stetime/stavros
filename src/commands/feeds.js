const { SlashCommandBuilder } = require('discord.js')
let { sourceList } = require('../rss')
const { logger } = require('../utils/utils')
module.exports = {
  data: new SlashCommandBuilder()
    .setName('feeds')
    .setDescription('list currently subscribed feeds'),
  async execute(interaction) {
    logger.debug(sourceList)
    const results = sourceList.map((feed) => {
      return `${feed.title}: ${feed.url}`
    })
    await interaction.reply({
      content: results.join('\n'),
      ephemeral: true,
    })
  },
}
