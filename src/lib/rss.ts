import { db } from "./db.js"
import Parser from "rss-parser"
import logger from "../utils/logger.js"
import handleError from "../utils/errorHandler.js"
import { EmbedBuilder } from "@discordjs/builders"
import { getYoutubeRSS, checkYoutubeURL } from "./youtube.js"
import { type Client, type TextBasedChannel } from "discord.js"

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
    image?: string,
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
        `redirectUrl for ${remoteFeed.title} : ${remoteFeed.redirectUrl}`,
      )
      db.updateUrl(this.id, remoteFeed.redirectUrl)
      this.url = remoteFeed.redirectUrl
    }

    const latest = remoteFeed.items[0]

    const date = latest?.isoDate || latest?.date
    const guid = latest?.guid || latest?.id

    if (!date && !guid) {
      throw Error(
        `found a malformed/dead feed while trying to update ${this.title}`,
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
        "enclosure" in post ? post?.enclosure?.url || null : post.link || null,
      )
      .setAuthor({ name: this.title })
    content &&
      embed.setDescription(
        content.length > 300 ? `${content.slice(0, 300)}...` : content,
      )
    const image =
      this.image || post.media?.["media:thumbnail"]?.[0]?.["$"].url || undefined
    image && embed.setThumbnail(image)
    "send" in channel && (await channel.send({ embeds: [embed] }))
  }
}

class FeedManager {
  private feeds: Feed[] = []

  init() {
    const raw = db.getFeeds()
    logger.info(`raw feeds: ${raw.length}`)
    this.feeds = db.getFeeds().map((source) => {
      logger.info("inside map")
      const { id, title, url, latest_post_date, latest_post_guid, image } =
        source
      const latestPost =
        latest_post_date || latest_post_guid
          ? {
              pubDate: latest_post_date ?? undefined,
              guid: latest_post_guid ?? undefined,
            }
          : undefined
      return new Feed(id!, title, url, latestPost, image)
    })
    logger.info(`init complete, ${this.feeds.length} feeds loaded`)
  }

  get() {
    logger.info(`get() called, feeds: ${this.feeds.length}`)
    return this.feeds
  }

  async check(client: Client) {
    const channel = client.channels.cache.get(process.env.channelId as string)
    if (!channel?.isTextBased()) {
      logger.warn("RSS channel not found/not text based")
      return
    }

    await Promise.all(
      this.feeds.map(async (source) => {
        try {
          const update = await source.update()
          if (!update?.length) return
          await Promise.allSettled(
            update.map((post) => source.broadcast(post, channel)),
          )
        } catch (error) {
          if (error instanceof Error) {
            handleError(Object.assign(error, { source: source.title }), client)
          }
        }
      }),
    )
  }

  async purge(id: string) {
    logger.debug("calling purgefeed")
    const match = this.feeds.findIndex((feed) => feed.id === id)
    if (match === -1) {
      logger.debug(`no match`)
      return
    }
    logger.debug(`got a match: ${match}`)
    const removed = this.feeds.splice(match, 1)[0]!
    logger.debug("calling purgefeed")
    db.purgeFeed(id)
    logger.info(`${removed.title} purged from the database and source list`)
    return true
  }

  async add(url: string) {
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
          dbFeed.image,
        )
      }
    } else {
      return false
    }
  }
}

function updateByDate(
  localDate: string | undefined,
  remoteFeed: Parser.Output<Parser.Item>,
) {
  if (!localDate) {
    return [remoteFeed.items[0]!]
  }
  const announce = remoteFeed.items.filter(
    (item) => item.isoDate && item.isoDate > localDate,
  )
  return announce.length > 0 ? announce : null
}

function updateByGuid(
  localGuid: string | undefined,
  remoteFeed: Parser.Output<Parser.Item>,
) {
  if (!localGuid) {
    return [remoteFeed.items[0]!]
  }
  const idx = remoteFeed.items.findIndex(
    (item: Parser.Item) => item.guid === localGuid || item.id === localGuid,
  )
  return idx !== -1 ? remoteFeed.items.slice(0, idx) : null
}

export const feedManager = new FeedManager()
