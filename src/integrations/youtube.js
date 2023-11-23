import axios from 'axios'
import { load } from 'cheerio'
import logger from '../utils/logger.js'

function extractChannelId(html) {
  const $ = load(html)
  const scriptTags = $(`script:not([src])`)
  let ytInitialData

  scriptTags.each((index, element) => {
    const scriptContent = $(element).html()
    if (scriptContent.includes('ytInitialData')) {
      ytInitialData = JSON.parse(/ytInitialData\s*=\s*({.*?});/.exec(scriptContent)[1])
      return false
    }
  })

  if (!ytInitialData) {
    throw new Error('ytInitialData data not found in the html')
  }

  const channelId = ytInitialData?.header?.c4TabbedHeaderRenderer?.channelId
  if (channelId) {
    return channelId
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
  return `https://youtube.com/feeds/videos.xml?channel_id=${channelId}`
}


function checkYoutubeURL(url) {
  const youtubeRssPattern = /https?:\/\/(?:www\.)?youtube\.com\/feeds\/videos\.xml\?.*/;
  const youtubePattern = /youtube/i; // Case-insensitive pattern for 'youtube'
  return youtubePattern.test(url) && !youtubeRssPattern.test(url);
}



export {
  getYoutubeRSS,
  checkYoutubeURL
}