import logger from '../utils/logger.js'
const apiUrl = 'https://oauth.reddit.com/r/crtgaming/new.json?limit=100'
const { refreshToken, redditClientId, clientSecret, refreshUrl } = process.env
let accessToken = ''

async function getToken(url, id, secret, refresh) {
  const basicAuth = Buffer.from(`${id}:${secret}`).toString('base64')
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Stavros/1.0.0',
    },
    body: `grant_type=refresh_token&refresh_token=${refresh}`,
  }
  const response = await fetch(url, requestOptions)
  const data = await response.json()
  accessToken = data
  logger.debug(`successfully refreshed reddit api token`)
}

async function getPvm() {
  logger.debug('getting a pvm')
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  logger.debug(`reddit api response code: ${response.status}`)
  if (response.status === 401) {
    logger.debug('refreshing token')
    await getToken(refreshUrl, redditClientId, clientSecret, refreshToken)
    getPvm()
  }
  const data = await response.json()
  const hasImg = data.data.children.filter((post) =>
    post.data.url.match(/\.(jpeg|jpg|gif|png)$/)
  )
  return hasImg[Math.floor(Math.random() * hasImg.length)].data.url
}

export default getPvm
