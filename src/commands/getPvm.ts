import { SlashCommandBuilder } from "discord.js"
import getPvm from "../lib/reddit.js"
import type { CommandInteraction } from "discord.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName("getpvm")
    .setDescription("get a sick pvm..."),
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply()
    const pvm = await getPvm()
    if (!pvm) {
      await interaction.editReply({
        content: "Couldn't get a PVM right now",
      })
      return
    }
    await interaction.editReply(pvm)
  },
}
