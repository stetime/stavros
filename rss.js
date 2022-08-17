const Source = require('./models/sources')
const Parser = require('rss-parser')
const parser = new Parser()

class Feed {
  constructor(id, title, url, currentGuid, image) {
    this.id = id
    this.title = title
    this.url = url
    this.currentGuid = currentGuid
    this.image = image
  }

  async update() {
    const parsed = await parser.parseURL(this.url)
    const latest = parsed.items[0]
    const guid = latest.guid || latest.id
    if (!this.currentGuid || this.currentGuid !== guid) {
      await Source.findByIdAndUpdate(this.id, {
        currentGuid: guid,
      })
      this.currentEp = parsed.items
        .slice(
          0,
          parsed.items.findIndex(
            (item) =>
              item.guid === this.currentGuid || item.id === this.currentGuid
          ) || 1
        )
        .slice(0, 3)
      this.currentGuid = guid
      return true
    } else {
      return
    }
  }
}

async function inputSingleFeed(url) {
  const feed = await parser.parseURL(url)
  const image = feed.image ? feed.image.url : ''
  if (feed.title) {
    if (await Source.findOne({ url: url })) {
      return false
    }
    await new Source({
      url: url,
      title: feed.title,
      image: image,
    }).save()
    const dbFeed = await Source.findOne({ url: url })
    return new Feed(dbFeed.id, dbFeed.title, dbFeed.url)
  } else {
    return false
  }
}

module.exports = { Feed, inputSingleFeed }
