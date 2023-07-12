import { SlashCommandBuilder } from "discord.js"
import getPvm from '../integrations/reddit.js'
import logger from '../utils/logger.js'

export const command = {
  data: new SlashCommandBuilder()
    .setName('getpvm')
    .setDescription('get a sick pvm...'),
  async execute(interaction) {
    try {
      await interaction.deferReply()
      const pvm = await getPvm()
      await interaction.editReply(pvm)
    } catch (error) {
      logger.info('caught error in getpvm')
      logger.error(error.message)
      await interaction.editReply(`there was a problem getting a pvm...`)
    }
  }
}
