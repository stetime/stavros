import { SlashCommandBuilder } from "discord.js"

export const command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('ping!!!!'),
  async execute(interaction) {
    await interaction.reply('pong')
  }
}