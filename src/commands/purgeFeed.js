const { SlashCommandBuilder } = require('discord.js')
const Sources = require('../models/sources')
let { sourceList } = require('../rss')
const { logger } = require('../utils/utils')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purgefeed')
    .setDescription('unsubscribe from a feed')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription(
          'the name of the feed to unsubscribe from. to check feeds run /feeds'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    const match = sourceList.find((feed) => feed.title === input)
    if (match) {
      await Sources.deleteOne({ title: input })
      const index = sourceList.findIndex((feed) => feed.title === input)
      sourceList.splice(index, 1)
      logger.info(`${match.title} has been purged from the db and sourcelist`)
      logger.debug(sourceList)
      await interaction.reply({
        content: `Unsubscribed from feed ${match.title}`
      })
    }
    else {
      await interaction.reply({
        content: `No feed matching ${input}`,
        ephemeral: true,
      })
    }
  },
}
