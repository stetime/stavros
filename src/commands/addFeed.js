import logger from '../utils/logger.js'
import { SlashCommandBuilder } from "discord.js"
import { inputSingleFeed, sourceList } from '../rss.js'

function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

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
    await interaction.deferReply()
    const input = interaction.options.getString('input')
    if (!isValidUrl(input)) {
      return await interaction.editReply({
        content: 'That is not a valid URL',
        ephemeral: true,
      })
    }
    const dupe = sourceList.find((feed) => feed.url === input)
    if (dupe) {
      logger.debug(`attempt to add dupe feed: ${input} by ${interaction.user.username}`)
      await interaction.editReply({
        content: `already subscribed to ${dupe.title}`,
        ephemeral: true,
      })
    } else {
      const newFeed = await inputSingleFeed(input)
      sourceList.push(newFeed)
      logger.info(`${newFeed.title} - has been added to the db and sourcelist by ${interaction.user.username}`)
      logger.debug(JSON.stringify(sourceList, null, 2))
      await interaction.editReply({
        content: `Subscribed to feed ${newFeed.title}`,
      })
    }
  }
}

