import { SlashCommandBuilder } from "discord.js"
import { mongo } from "../integrations/mongo.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName('addprefix')
    .setDescription('add a prefix to the bot')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('the prefix to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    if (await mongo.findPrefix(input)) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true
      })
      return
    }
    await mongo.addPrefix(input)
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true
    })
  }
}