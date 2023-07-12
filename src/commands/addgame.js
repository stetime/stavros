import { SlashCommandBuilder } from "discord.js"
import { mongo } from '../integrations/mongo.js'

export const command = {
  data: new SlashCommandBuilder()
    .setName('addgame')
    .setDescription('add a game to the bot')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('the game to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    if (await mongo.findGame(input)) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true
      })
      return
    }
    await mongo.addGame(input)
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true
    })
  }
}