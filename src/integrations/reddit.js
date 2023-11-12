import logger from '../utils/logger.js';
import axios from 'axios';

const apiUrl = 'https://oauth.reddit.com/r/crtgaming/new.json?limit=100'
const { refreshToken, redditClientId, clientSecret, refreshUrl } = process.env
let accessToken = ''

async function getToken(url, id, secret, refresh) {
  const basicAuth = Buffer.from(`${id}:${secret}`).toString('base64')
  const requestData = new URLSearchParams()
  requestData.append('grant_type', 'refresh_token')
  requestData.append('refresh_token', refresh)

  const config = {
    method: 'POST',
    url,
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Stavros/1.0.0',
    },
    data: requestData.toString(),
  };

  try {
    const response = await axios(config);
    accessToken = response.data
    logger.debug(`successfully refreshed reddit api token`)
  } catch (error) {
    logger.error(`error refreshing token: ${error.message}`)
  }
}

async function getPvm() {
  logger.debug('getting a pvm');
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    logger.debug(`reddit api response code: ${response.status}`)

    if (response.status === 401) {
      logger.debug('refreshing token');
      await getToken(refreshUrl, redditClientId, clientSecret, refreshToken)
      return getPvm()
    }

    const data = response.data;
    const hasImg = data.data.children.filter((post) =>
      post.data.url.match(/\.(jpeg|jpg|gif|png)$/)
    )
    return hasImg[Math.floor(Math.random() * hasImg.length)].data.url
  } catch (error) {
    logger.error(`error getting PVM: ${error.message}`)
    throw error
  }
}

export default getPvm
