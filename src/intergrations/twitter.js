import { TwitterApi } from "twitter-api-v2"
import logger from '../utils/logger.js'

const twitter = new TwitterApi({
  appKey: process.env.twitterAppKey,
  appSecret: process.env.twitterAppSecret,
  accessToken: process.env.twitterAccessToken,
  accessSecret: process.env.twitterAccessSecret
})

async function tweet(content) {
  try {
    await twitter.v1.tweet(content)
  } catch (error) {
    logger.error(error)
  }
}

export default tweet