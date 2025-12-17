import { TwitterApi } from "twitter-api-v2"

const twitter = new TwitterApi({
  appKey: process.env.twitterAppKey,
  appSecret: process.env.twitterAppSecret,
  accessToken: process.env.twitterAccessToken,
  accessSecret: process.env.twitterAccessSecret,
})

async function tweet(content: string) {
  await twitter.v2.tweet(content)
}

export default tweet
