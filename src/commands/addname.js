import { SlashCommandBuilder } from "discord.js"
import { mongo } from '../intergrations/mongo.js'

export const command = {
  data: new SlashCommandBuilder()
    .setName('addname')
    .setDescription('add a name to the bot')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('the name to add')
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString('input')
    if (await mongo.findName(input)) {
      await interaction.reply({
        content: `${input} is already in the db`,
        ephemeral: true
      })
      return
    }
    await mongo.addName(input)
    await interaction.reply({
      content: `${input} added to the db`,
      ephemeral: true
    })
  }
}