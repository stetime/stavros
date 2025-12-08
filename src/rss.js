import { db } from './integrations/db'
import Parser from 'rss-parser'
import logger from './utils/logger.js'
import handleError from './utils/errorHandler.js'
import { EmbedBuilder } from '@discordjs/builders'
import { isAfter, isValid } from 'date-fns'
import { getYoutubeRSS, checkYoutubeURL } from './integrations/youtube.js'

const parser = new Parser({
  customFields: {
    item: [['media:group', 'media', { keepArray: false }]],
  },
})

const sourceList = []

class Feed {
  constructor(id, title, url, latestPost, image) {
    this.id = id
    this.title = title
    this.url = url
    this.latestPost = latestPost || undefined
    this.image = image
  }

  async update() {
    logger.debug(`attempting to update feed ${this.title}`)
    const remoteFeed = await parser.parseURL(this.url)
    if (!remoteFeed?.items) {
      return
    }

    if (remoteFeed.redirectUrl) {
      logger.debug(`redirectUrl for ${remoteFeed.title} : ${remoteFeed.redirectUrl}`)
      db.updateUrl(this.id, remoteFeed.redirectUrl)
      this.url = remoteFeed.redirectUrl
    }

    const latest = remoteFeed.items[0]
    const date = new Date(latest?.pubDate || latest?.date)
    const guid = latest?.guid || latest?.id

    if (!isValid(date) && !guid) {
      throw Error(
        `found a malformed/dead feed while trying to update ${this.title}`
      )
    }

    const updates = date
      ? updateByDate(this.latestPost?.pubDate, remoteFeed)
      : updateByGuid(this.latestPost?.guid, remoteFeed)

    if (updates) {
      db.updateFeed(this.id, date.toISOString(), guid ?? null)
      this.latestPost = {
        pubDate: date,
        guid: guid,
      }
      return updates.slice(0, 3)
    }
    logger.debug(`no updates for ${this.title}`)
    return
  }

  async broadcast(post, channel) {
    const content =
      post.contentSnippet ||
      post.content ||
      post.summary ||
      post.description ||
      post.media?.['media:description'][0]
    const embed = new EmbedBuilder()
      .setTitle(post.title)
      .setURL('enclosure' in post ? post.enclosure.url : post.link)
      .setAuthor({ name: this.title })
    content &&
      embed.setDescription(
        content.length > 300 ? `${content.slice(0, 300)}...` : content
      )
    const image =
      this.image || post.media?.['media:thumbnail'][0]['$'].url || null
    image && embed.setThumbnail(image)
    await channel.send({ embeds: [embed] })
  }
}

function updateByDate(localDate, remoteFeed) {
  if (!localDate) {
    return [remoteFeed.items[0]]
  }
  const announce = remoteFeed.items.filter((item) =>
    isAfter(new Date(item.pubDate), localDate)
  )
  return announce.length > 0 ? announce : null
}

function updateByGuid(localGuid, remoteFeed) {
  if (!localGuid) {
    return [remoteFeed.items[0]]
  }
  const idx = remoteFeed.items.findIndex(
    (item) => item.guid === localGuid || item.id === localGuid
  )
  return idx !== -1 ? remoteFeed.items.slice(0, idx) : null
}

async function inputSingleFeed(url) {
  if (url.includes('youtube') && checkYoutubeURL(url)) {
    url = await getYoutubeRSS(url)
  }
  const feed = await parser.parseURL(url)
  if (feed.title) {
    if (db.getFeed(url)) {
      return false
    }
    const image = feed.image?.url || feed.itunes?.image || null
    db.addFeed(url, feed.title, image)
    const dbFeed = db.getFeed(url)
    return new Feed(dbFeed.id, dbFeed.title, dbFeed.url, null, dbFeed.image)
  } else {
    return false
  }
}

async function purgeFeed(id) {
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
    const latestPost = latest_post_date || latest_post_guid ? {
      pubDate: latest_post_date ? new Date(latest_post_date) : null,
      guid: latest_post_guid ?? null,
    } : null
    const feed = new Feed(id, title, url, latestPost, image)
    sourceList.push(feed)
  })
  logger.debug(JSON.stringify(sourceList, null, 2))
}

async function checkFeeds(client) {
  const channel = client.channels.cache.get(process.env.channelId)
  for (const source of sourceList) {
    try {
      const update = await source.update()
      if (update) {
        for (const post of update) {
          await source.broadcast(post, channel)
        }
      }
    } catch (error) {
      error.source = source.title
      handleError(error, client)
    }
  }
}

export { sourceList, inputSingleFeed, purgeFeed, initFeeds, checkFeeds }
