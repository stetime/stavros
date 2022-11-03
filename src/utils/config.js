const { token, guildId, channelId, clientId } = process.env
const { appKey, appSecret, accessToken, accessSecret } = process.env
const { connectionString } = process.env
const interval = process.env.NODE_ENV === 'development' ? 0.1 : 1
const maxNewArticles = 3

module.exports = {
  interval,
  maxNewArticles,
  token,
  guildId,
  channelId,
  clientId,
  appKey,
  appSecret,
  accessToken,
  accessSecret,
  connectionString,
}
