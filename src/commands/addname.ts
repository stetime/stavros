import { SlashCommandBuilder } from "discord.js"
import { db } from "../lib/db"
import type { CommandInteraction } from "discord.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName("addname")
    .setDescription("add a name to the bot")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("the name to add")
        .setRequired(true)
    ),
  async execute(interaction: CommandInteraction) {
    const input = interaction.options.get("input")?.value as string
    if (await db.findName(input)) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true,
      })
      return
    }
    db.addName(input)
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true,
    })
  },
}
