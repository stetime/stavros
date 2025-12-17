import { load } from "cheerio"
import logger from "../utils/logger"

function extractChannelId(html: string) {
  const $ = load(html)
  const identifierContent = $('meta[itemprop="identifier"]').attr("content")

  if (identifierContent) {
    return identifierContent
  } else {
    throw new Error("channel id not found")
  }
}

async function getYoutubeRSS(url: string): Promise<string | null> {
  const res = await fetch(url)
  if (!res.ok) {
    logger.error("Youtube returned a non-200 status", res.status)
    return null
  }
  const channelId = extractChannelId(await res.text())
  if (!channelId) {
    logger.error("couldn't extract a channelId from response data")
    return null
  }
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
}

function checkYoutubeURL(url: string) {
  const youtubeRssPattern =
    /https?:\/\/(?:www\.)?youtube\.com\/feeds\/videos\.xml\?.*/
  const youtubePattern = /youtube/i
  return youtubePattern.test(url) && !youtubeRssPattern.test(url)
}

export { getYoutubeRSS, checkYoutubeURL }
