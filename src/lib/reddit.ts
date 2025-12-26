import logger from "../utils/logger.js"

const apiUrl = "https://oauth.reddit.com/r/crtgaming/new.json?limit=100"
const { refreshToken, redditClientId, clientSecret, refreshUrl } = process.env
let accessToken = ""

type RedditPost = {
  data: {
    url?: string
  }
}

type RedditApiResponse = {
  data: {
    children: RedditPost[]
  }
}

type RedditTokenResponse = {
  access_token: string
}

async function getToken(
  url: string,
  id: string,
  secret: string,
  refresh: string
) {
  const basicAuth = Buffer.from(`${id}:${secret}`).toString("base64")
  const body = new URLSearchParams()
  body.append("grant_type", "refresh_token")
  body.append("refresh_token", refresh)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "rssbot/1.0.0",
      },
      body: body.toString(),
    })

    if (!res.ok) {
      throw new Error(`Reddit token refresh failed: HTTP ${res.status}`)
    }

    const json = (await res.json()) as RedditTokenResponse
    accessToken = json.access_token
    logger.debug("successfully refreshed reddit api token")
  } catch (error) {
    error instanceof Error &&
      logger.error(`error refreshing token: ${error.message}`)
  }
}

async function getPvm() {
  logger.debug("getting a pvm")
  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "rssbot/1.0.0",
      },
    })

    if (res.status === 401) {
      logger.debug("refreshing token")
      await getToken(refreshUrl!, redditClientId!, clientSecret!, refreshToken!)
      return getPvm()
    }

    if (!res.ok) {
      throw new Error(`Reddit API error: HTTP ${res.status}`)
    }

    const json = (await res.json()) as RedditApiResponse
    const posts = json.data.children
    const withImages = posts.filter((post: RedditPost) => {
      return post.data.url && post.data.url.match(/\.(jpe?g|png|gif)$/)
    })
    const randomPost = withImages[Math.floor(Math.random() * withImages.length)]
    return randomPost?.data.url
  } catch (error) {
    error instanceof Error &&
      logger.error(`error getting PVM: ${error.message}`)
  }
}

export default getPvm
