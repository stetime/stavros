import { SlashCommandBuilder } from "discord.js"
import getPvm from '../integrations/reddit.js'

export const command = {
  data: new SlashCommandBuilder()
    .setName('getpvm')
    .setDescription('get a sick pvm...'),
  async execute(interaction) {
    await interaction.deferReply()
    const pvm = await getPvm()
    await interaction.editReply(pvm)
  }
}
