import logger from './logger.js'
import { EmbedBuilder, Colors } from 'discord.js'
import { format } from 'date-fns'

// get related guild?
export default async function handleError(error, client, interaction = null) {
  logger.error(error.stack)

  if (
    interaction &&
    typeof interaction === 'object' &&
    interaction.isCommand()
  ) {
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('40') ||
      error.message.includes('Unexpected close')
    ) {
      await interaction.editReply('That is not a valid feed')
    } else if (error.message.includes('429')) {
      await interaction.editReply(
        'We are currently rate limited, try again later'
      )
    } else {
      await interaction.editReply("Can't do that right now")
    }
  }

  const fields = [
    {
      name: 'Date',
      value: format(new Date(), 'yyyy-MM-dd HH:mm'),
      inline: true,
    }
  ]

  if (interaction) {
    fields.push(
      { name: 'User', value: interaction.user ? interaction.user.tag : 'N/A', inline: true },
      { name: 'Command', value: interaction.isCommand() ? interaction.commandName : 'N/A', inline: true }
    )
  }

  const adminChannel = client.channels.cache.get(process.env.adminChannel)
  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle(error.name)
    .setDescription(error.message)
    .addFields(fields)
  await adminChannel?.send({ embeds: [embed] })
}
