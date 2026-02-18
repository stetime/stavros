import { SlashCommandBuilder } from "discord.js"
import { EmbedBuilder } from "@discordjs/builders"
import type { CommandInteraction } from "discord.js"
import { feedManager } from "../lib/rss"

export const command = {
  data: new SlashCommandBuilder()
    .setName("feeds")
    .setDescription("list currently subscribed feeds"),
  async execute(interaction: CommandInteraction) {
    const sourceList = feedManager.get()
    if (sourceList.length < 1) {
      await interaction.reply({
        content: "there are no active feed subscriptions",
        ephemeral: true,
      })
    } else {
      const results = sourceList.map((feed) => {
        const embed = new EmbedBuilder()
          .setTitle(feed.title)
          .setURL(feed.url)
          .setDescription(feed.url)
        feed.image && embed.setThumbnail(feed.image)
        return embed
      })
      await interaction.reply({
        embeds: results,
        ephemeral: true,
      })
    }
  },
}
