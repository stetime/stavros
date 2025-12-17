import { SlashCommandBuilder } from "discord.js"
import getPvm from "../lib/reddit"
import type { CommandInteraction } from "discord.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName("getpvm")
    .setDescription("get a sick pvm..."),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply()
    const pvm = await getPvm()
    await interaction.editReply(pvm)
  },
}
