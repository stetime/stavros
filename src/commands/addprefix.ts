import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { db } from "../lib/db.js"
import logger from "../utils/logger.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName("addprefix")
    .setDescription("add a prefix to the bot")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("the prefix to add")
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" })
    const input = interaction.options.get("input")?.value as string
    logger.debug(input)
    if (db.findPrefix(input)) {
      await interaction.editReply({
        content: `${input} is already in the db`,
      })
      return
    }
    db.addPrefix(input)
    await interaction.editReply({
      content: `${input} added to the db`,
    })
  },
}
