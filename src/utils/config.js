// discord 
const { token, guildId, channelId, clientId } = process.env
// twitter
const { appKey, appSecret, accessToken, accessSecret } = process.env

const { connectionString } = process.env
const interval = process.env.NODE_ENV === 'development' ? 0.1 : 1
const twitterEnabled = true
const maxNewArticles = 3
const defaultName = 'Stavros'
const defaultGame = 'Really Simple Syndication'

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
  defaultName,
  defaultGame,
  twitterEnabled
}
