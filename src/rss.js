import { mongo } from './integrations/mongo.js'
import Parser from 'rss-parser'
import logger from './utils/logger.js'
import { EmbedBuilder } from '@discordjs/builders'
import { isAfter } from 'date-fns'
import { getYoutubeRSS, checkYoutubeURL } from './integrations/youtube.js'

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
    try {
      const remoteFeed = await parser.parseURL(this.url)
      const latest = remoteFeed.items[0]
      const date = new Date(latest.pubDate || latest.date)
      const guid = latest.guid || latest.id
      if (!date && !guid) {
        throw new Error(`found a malformed feed while trying to update ${this.title}`)
      }
      let updates
      if (date) {
        updates = updateByDate(this.latestPost.pubDate, remoteFeed)
      } else {
        updates = updateByGuid(this.latestPost.guid, remoteFeed)
      }
      if (updates) {
        await mongo.updateFeed(this.id, date, guid)
        this.latestPost = {
          pubDate: date,
          guid: guid
        }
      }
      return updates
    } catch (error) {
      const adminChannel = client.channels.cache.get(process.env.adminChannel)
      adminChannel.send(error)
      logger.error(`error updating ${this.title} - ${JSON.stringify(error, null, 2)}`)
    }
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
    content && embed.setDescription(
      content.length > 300 ? `${content.slice(0, 300)}...` : content
    )
    const image = this.image || post.media?.['media:thumbnail'][0]['$'].url || null
    image && embed.setThumbnail(image)
    await channel.send({ embeds: [embed] })
  }
}


function updateByDate(localDate, remoteFeed) {
  const announce = []
  if (!localDate) {
    announce.push(remoteFeed.items[0])
    return announce
  }
  for (const item of remoteFeed.items) {
    const date = new Date(item.pubDate)
    if (isAfter(date, localDate)) {
      announce.push(item)
    }
  }
  return announce.length > 0 ? announce : false
}

function updateByGuid(localGuid, remoteFeed) {
  const announce = []
  if (!localGuid) {
    announce.push(remoteFeed.items[0])
    return announce
  }
  for (const item of remoteFeed.items) {
    if (item.guid === localGuid || item.id === localGuid) {
      break
    }
    announce.push(item)
  }
  return announce.length > 0 ? announce : false
}

async function inputSingleFeed(url) {
  if (url.includes('youtube') && checkYoutubeURL(url)) {
    console.log('make me wanna SHIT!')
    url = await getYoutubeRSS(url)
  }
  console.log(url)
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
      logger.error(
        `error while parsing ${source.title} - ${JSON.stringify(error, null, 2)}`
      )
      const adminChannel = client.channels.cache.get(process.env.adminChannel)
      adminChannel.send(`error while parsing ${source.title}`)
      continue
    }
  }
}

export {
  sourceList,
  inputSingleFeed,
  purgeFeed,
  initFeeds,
  checkFeeds
}
