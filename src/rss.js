import { mongo } from './intergrations/mongo.js'
import Parser from 'rss-parser'
import logger from './utils/logger.js'
import { EmbedBuilder } from '@discordjs/builders'

const parser = new Parser({
  customFields: {
    item: [
      ['media:group', 'media', { keepArray: false }]
    ]
  }
})

const sourceList = []

class Feed {
  constructor(id, title, url, latestPost, image) {
    (this.id = id),
      (this.title = title),
      (this.url = url),
      (this.latestPost = latestPost || undefined),
      (this.image = image)
  }

  async update() {
    logger.debug(`attempting to update feed ${this.title}`)
    const parsed = await parser.parseURL(this.url)
    const latest = parsed.items[0]
    let announce
    const date = new Date(latest.pubDate)
    let guid = latest.guid || latest.id
    // incase rss-parser perceives an isPermaLink="false" guid as an object:
    if (typeof guid === 'object') {
      guid = null
    }
    if (!date && !guid) {
      logger.warn(`found a malformed feed while trying to update ${this.title}`)
      return
    }
    if (date) {
      if (!this.latestPost?.pubDate || date > this.latestPost?.pubDate) {
        await mongo.updateFeed(this.id, date, guid)
        const index = parsed.items.findIndex(
          (item) => item.pubDate === this.latestPost?.pubDate
        )
        announce =
          index !== -1 ? parsed.items.slice(0, index) : parsed.items.slice(0, 1)
        this.latestPost = {
          pubDate: date,
          guid: guid || null,
        }
      } else {
        return
      }
    } else {
      if (!this.latestPost?.guid || this.latestPost?.guid !== guid) {
        await mongo.updateFeed(this.id, null, guid)
        announce = parsed.items.slice(
          0,
          parsed.items.findIndex(
            (item) =>
              item.guid === this.latestPost.guid ||
              item.id === this.latestPost.guid
          ) || 1
        )
        this.latestPost = {
          pubDate: null,
          guid: guid,
        }
      } else {
        return
      }
    }
    return announce.slice(0, 3)
  }
}

async function inputSingleFeed(url) {
  const feed = await parser.parseURL(url)
  if (feed.title) {
    if (await mongo.getFeed(url)) {
      return false
    }
    const image = feed.image?.url || feed.itunes?.image || null
    await mongo.addFeed(url, feed, image)
    const dbFeed = await mongo.getFeed(url)
    return new Feed(dbFeed.id, dbFeed.title, dbFeed.url, null, dbFeed.image)
  } else {
    return false
  }
}

async function purgeFeed(id) {
  const match = sourceList.find((feed) => feed.id === id)
  if (match) {
    await mongo.purgeFeed(id)
    const index = sourceList.findIndex((feed) => feed.id === id)
    sourceList.splice(index, 1)
    logger.info(`${match.title} purged from the database and source list`)
    logger.debug(JSON.stringify(sourceList, null, 2))
    return true
  }
  return
}

async function initFeeds() {
  const sources = await mongo.getFeeds()
  sources.forEach((source) => {
    const { id, title, url, latestPost, image } = source
    const feed = new Feed(id, title, url, latestPost, image)
    sourceList.push(feed)
    logger.debug(source.latestPost?.pubDate instanceof Date)
  })
  logger.debug(JSON.stringify(sourceList, null, 2))
}

async function checkFeeds(client) {
  for (const source of sourceList) {
    const update = await source.update()
    if (update) {
      for (const post of update) {
        logger.debug(`source update ${source.title} - ${post.guid || post.id}`)
        const channel = client.channels.cache.get(process.env.channelId)
        const content =
          post.contentSnippet ||
          post.content ||
          post.summary ||
          post.description ||
          post.media?.['media:description'][0]
        const embed = new EmbedBuilder()
          .setTitle(post.title)
          .setURL('enclosure' in post ? post.enclosure.url : post.link)
          .setAuthor({ name: source.title })
        if (content) {
          embed.setDescription(
            content.length > 300 ? `${content.slice(0, 300)}...` : content
          )
        }
        const image = source.image || post.media?.['media:thumbnail'][0]['$'].url || null
        image && embed.setThumbnail(image)
        channel.send({ embeds: [embed] })
      }
    }
  }
}

export { sourceList, inputSingleFeed, purgeFeed, initFeeds, checkFeeds }
