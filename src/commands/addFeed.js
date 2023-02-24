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
    try {
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
    } catch (error) {
      if (error.message.includes('ECONNREFUSED')
        || error.message.includes('40') 
        || error.message.includes('Unexpected close')) {
        await interaction.reply('That is not a valid feed.')
      } else if (error.message.includes('429')) {
        await interaction.reply('We are currently rate-limited. Try again later.')
      } else {
        await interaction.reply('Can\'t do that pal')
        logger.error(error)
      }
    }

  }
}
