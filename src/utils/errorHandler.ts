import logger from "./logger.js"
import { EmbedBuilder, Colors } from "discord.js"
import type { Interaction, Client, TextChannel } from "discord.js"

export interface ErrorWithSource extends Error {
  source?: string
}

interface ErrorField {
  name: string
  value: string
  inline?: boolean
}

export default async function handleError(
  error: unknown,
  client: Client,
  interaction: Interaction | null = null
): Promise<void> {
  if (!(error instanceof Error)) {
    logger.error("non error object caught", error)
    return
  }

  const errorWithSource = error as ErrorWithSource

  if (
    interaction &&
    typeof interaction === "object" &&
    interaction.isCommand()
  ) {
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("40") ||
      error.message.includes("Unexpected close")
    ) {
      await interaction.editReply("That is not a valid feed")
    } else if (error.message.includes("429")) {
      await interaction.editReply(
        "We are currently rate limited, try again later"
      )
    } else {
      await interaction.editReply("Can't do that right now")
    }
  }

  const fields: ErrorField[] = [
    {
      name: "Date",
      value: new Date().toISOString(),
      inline: true,
    },
  ]

  if (interaction) {
    fields.push(
      {
        name: "User",
        value: interaction.user ? interaction.user.tag : "N/A",
        inline: true,
      },
      {
        name: "Command",
        value: interaction.isCommand() ? interaction.commandName : "N/A",
        inline: true,
      }
    )
  }

  if (errorWithSource.source) {
    fields.push({ name: "source", value: errorWithSource.source, inline: true })
  }

  logger.error(JSON.stringify({ stack: error.stack, fields: fields }, null, 2))

  const adminChannel = client.channels.cache.get(
    process.env.adminChannel as string
  )
  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle(error.name)
    .setDescription(error.message)
    .addFields(fields)
  if (
    adminChannel &&
    "send" in adminChannel &&
    typeof (adminChannel as TextChannel).send === "function"
  ) {
    await (adminChannel as TextChannel).send({ embeds: [embed] })
  }
}
