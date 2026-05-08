import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js"
import { db } from "../lib/db.js"

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
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" })
    const input = interaction.options.get("input")?.value as string
    if (await db.findName(input)) {
      await interaction.editReply({
        content: `${input} is already in the db`,
      })
      return
    }
    db.addName(input)
    await interaction.editReply({
      content: `${input} added to the db`,
    })
  },
}
