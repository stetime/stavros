import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js"

export const command = {
  data: new SlashCommandBuilder().setName('purge').setDescription('unsubscribe from rss feed'),
  async execute(interaction) {
    const { sourceList } = await import('../rss.js')
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select')
          .setPlaceholder('select')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            sourceList.map((source) => {
              return {
                label: source.title,
                description: source.url,
                value: source.id
              }
            })
          )
      )
    await interaction.reply({ content: 'Select a feed to purge:', components: [row] })
  }
}

