import logger from '../utils/logger.js'
import { SlashCommandBuilder } from "discord.js"
import { inputSingleFeed, sourceList } from '../rss.js'

export const command = {
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
      await interaction.deferReply()
      const input = interaction.options.getString('input')
      const dupe = sourceList.find((feed) => feed.url === input)
      if (dupe) {
        logger.debug(`attempt to add dupe feed: ${input}`)
        await interaction.editReply({
          content: `already subscribed to ${dupe.title}`,
          ephemeral: true,
        })
      } else {
        const newFeed = await inputSingleFeed(input)
        sourceList.push(newFeed)
        logger.info(`${newFeed.title} - has been added to the db and sourcelist`)
        logger.debug(JSON.stringify(sourceList, null, 2))
        await interaction.editReply({
          content: `Subscribed to feed ${newFeed.title}`,
        })
      }
    } catch (error) {
      if (error.message.includes('ECONNREFUSED')
        || error.message.includes('40')
        || error.message.includes('Unexpected close')) {
        await interaction.editReply('That is not a valid feed.')
      } else if (error.message.includes('429')) {
        await interaction.editReply('We are currently rate-limited. Try again later.')
      } else {
        await interaction.editReply('Can\'t do that pal')
        logger.error(error)
      }
    }

  }
}

