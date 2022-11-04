const { SlashCommandBuilder } = require('discord.js')
const rss = require('../rss')
const { logger } = require('../utils/utils')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addfeed')
    .setDescription('subscribe to a new RSS/Atom feed')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('the url of the feed to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    const dupe = rss.sourceList.find((feed) => feed.url === input)
    if (dupe) {
      logger.debug(`attempt to add dupe feed: ${input}`)
      await interaction.reply({
        content: `already subscribed to ${dupe.title}`,
        ephemeral: true,
      })
    } else {
      const newFeed = await rss.inputSingleFeed(input)
      rss.sourceList.push(newFeed)
      logger.info(`${newFeed.title} - has been added to the db and sourcelist`)
      logger.debug(rss.sourceList)
      await interaction.reply({
        content: `Subscribed to feed ${newFeed.title}`,
      })
    }
  },
}
