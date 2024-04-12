import axios from 'axios'
import { load } from 'cheerio'
import logger from '../utils/logger.js'

function extractChannelId(html) {
  const $ = load(html)
  const identifierContent = $('meta[itemprop="identifier"]').attr('content')

  if (identifierContent) {
    return identifierContent
  } else {
    throw new Error('channel id not found')
  }

}

async function getYoutubeRSS(url) {
  const response = await axios.get(url)
  if (response.status !== 200) {
    logger.error('Youtube returned a non-200 status', response.status)
    return null
  }
  const channelId = extractChannelId(response.data)
  if (!channelId) {
    logger.error("couldn't extract a channelId from response data")
    return null
  }
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
}


function checkYoutubeURL(url) {
  const youtubeRssPattern = /https?:\/\/(?:www\.)?youtube\.com\/feeds\/videos\.xml\?.*/
  const youtubePattern = /youtube/i
  return youtubePattern.test(url) && !youtubeRssPattern.test(url)
}



export {
  getYoutubeRSS,
  checkYoutubeURL
}