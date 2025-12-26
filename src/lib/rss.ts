import { db } from "./db.js"
import Parser from "rss-parser"
import logger from "../utils/logger.js"
import handleError from "../utils/errorHandler.js"
import { EmbedBuilder } from "@discordjs/builders"
import { getYoutubeRSS, checkYoutubeURL } from "./youtube.js"
import type { Client, TextBasedChannel } from "discord.js"
import type { ErrorWithSource } from "../utils/errorHandler.js"

declare module "rss-parser" {
  interface Item {
    id?: string
    date?: string
    description?: string
    media?: {
      "media:thumbnail"?: Array<{
        $: {
          url: string
        }
      }>
      "media:description"?: string[]
    }
  }
}

interface LatestPost {
  pubDate?: string
  guid?: string
}

const parser = new Parser({
  customFields: {
    item: [["media:group", "media", { keepArray: false }]],
  },
})

const sourceList: Feed[] = []

class Feed {
  id: string
  title: string
  url: string
  latestPost?: LatestPost
  image?: string | null

  constructor(
    id: string,
    title: string,
    url: string,
    latestPost?: LatestPost,
    image?: string
  ) {
    this.id = id
    this.title = title
    this.url = url
    this.latestPost = latestPost
    this.image = image
  }

  async update() {
    logger.debug(`attempting to update feed ${this.title}`)
    const remoteFeed = await parser.parseURL(this.url)
    if (!remoteFeed?.items) {
      return
    }

    if (remoteFeed.redirectUrl) {
      logger.debug(
        `redirectUrl for ${remoteFeed.title} : ${remoteFeed.redirectUrl}`
      )
      db.updateUrl(this.id, remoteFeed.redirectUrl)
      this.url = remoteFeed.redirectUrl
    }

    const latest = remoteFeed.items[0]

    const date = latest?.isoDate || latest?.date
    const guid = latest?.guid || latest?.id

    if (!date && !guid) {
      throw Error(
        `found a malformed/dead feed while trying to update ${this.title}`
      )
    }

    const updates = date
      ? updateByDate(this.latestPost?.pubDate, remoteFeed)
      : updateByGuid(this.latestPost?.guid, remoteFeed)

    if (updates) {
      logger.debug(`found ${updates.length} new posts for ${this.title}`)
      db.updateFeed(this.id, date, guid)
      this.latestPost = {
        pubDate: date,
        guid: guid,
      }
      return updates.slice(0, 3)
    }
    logger.debug(`no updates for ${this.title}`)
    return
  }

  async broadcast(post: Parser.Item, channel: TextBasedChannel) {
    const content =
      post.contentSnippet ||
      post.content ||
      post.summary ||
      post.description ||
      post.media?.["media:description"]?.[0]
    const embed = new EmbedBuilder()
      .setTitle(post.title || null)
      .setURL(
        "enclosure" in post ? post?.enclosure?.url || null : post.link || null
      )
      .setAuthor({ name: this.title })
    content &&
      embed.setDescription(
        content.length > 300 ? `${content.slice(0, 300)}...` : content
      )
    const image =
      this.image || post.media?.["media:thumbnail"]?.[0]?.["$"].url || undefined
    image && embed.setThumbnail(image)
    await channel.send({ embeds: [embed] })
  }
}

function updateByDate(
  localDate: string | undefined,
  remoteFeed: Parser.Output<Parser.Item>
) {
  if (!localDate) {
    return [remoteFeed.items[0]]
  }
  const announce = remoteFeed.items.filter(
    (item) => item.isoDate && item.isoDate > localDate
  )
  return announce.length > 0 ? announce : null
}

function updateByGuid(
  localGuid: string | undefined,
  remoteFeed: Parser.Output<Parser.Item>
) {
  if (!localGuid) {
    return [remoteFeed.items[0]]
  }
  const idx = remoteFeed.items.findIndex(
    (item: Parser.Item) => item.guid === localGuid || item.id === localGuid
  )
  return idx !== -1 ? remoteFeed.items.slice(0, idx) : null
}

async function inputSingleFeed(url: string) {
  if (url.includes("youtube") && checkYoutubeURL(url)) {
    const youtubeURL = await getYoutubeRSS(url)
    if (!youtubeURL) {
      return false
    }
    url = youtubeURL
  }
  const feed = await parser.parseURL(url)
  if (feed.title) {
    if (db.getFeed(url)) {
      return false
    }
    const image = feed.image?.url || feed.itunes?.image || null
    db.addFeed(url, feed.title, image)
    const dbFeed = db.getFeed(url)
    if (dbFeed) {
      return new Feed(
        dbFeed.id!,
        dbFeed.title,
        dbFeed.url,
        undefined,
        dbFeed.image
      )
    }
  } else {
    return false
  }
}

async function purgeFeed(id: string) {
  const match = sourceList.find((feed) => feed.id === id)
  if (match) {
    db.purgeFeed(id)
    const index = sourceList.findIndex((feed) => feed.id === id)
    sourceList.splice(index, 1)
    logger.info(`${match.title} purged from the database and source list`)
    logger.debug(`current source list:\n${JSON.stringify(sourceList, null, 2)}`)
    return true
  }
  return
}

function initFeeds() {
  const sources = db.getFeeds()
  sources.forEach((source) => {
    logger.debug(JSON.stringify(source, null, 2))
    const { id, title, url, latest_post_date, latest_post_guid, image } = source
    const latestPost =
      latest_post_date || latest_post_guid
        ? {
            pubDate: latest_post_date ?? undefined,
            guid: latest_post_guid ?? undefined,
          }
        : undefined
    const feed = new Feed(id!, title, url, latestPost, image)
    sourceList.push(feed)
  })
  logger.debug(JSON.stringify(sourceList, null, 2))
}

async function checkFeeds(client: Client) {
  const startTime = Date.now()
  const channel = client.channels.cache.get(process.env.channelId as string)
  for (const source of sourceList) {
    try {
      const update = await source.update()
      if (update && channel && "send" in channel) {
        for (const post of update) {
          if (post) {
            await source.broadcast(post, channel as TextBasedChannel)
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorWithSource: ErrorWithSource = Object.assign(error, {
          source: source.title,
        })
        handleError(errorWithSource, client)
      }
    }
  }
  const duration = Date.now() - startTime
  logger.info(`rss check completed in ${duration} ms`)
  if (duration > 30000) {
    logger.warn(`rss check took an unusually long time: ${duration} ms`)
  }
}

export { sourceList, inputSingleFeed, purgeFeed, initFeeds, checkFeeds }
