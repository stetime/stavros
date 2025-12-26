import { SlashCommandBuilder } from "discord.js"
import { db } from "../lib/db.js"
import type { CommandInteraction } from "discord.js"

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
  async execute(interaction: CommandInteraction) {
    const input = interaction.options.get("string")?.value as string
    if (db.findPrefix(input)) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true,
      })
      return
    }
    db.addPrefix(input)
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true,
    })
  },
}
