import { SlashCommandBuilder } from "discord.js"
import { db } from "../lib/db.js"
import type { CommandInteraction } from "discord.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName("addgame")
    .setDescription("add a game to the bot")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("the game to add")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const input = interaction.options.get("input")?.value as string
    if (db.findGame(input)) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true,
      })
      return
    }
    db.addGame(input)
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true,
    })
  },
}
