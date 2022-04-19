const Source = require('./models/sources');
const Parser = require('rss-parser');
const parser = new Parser();

class Feed {
  constructor(id, title, url, currentGuid, image) {
    this.id = id;
    this.title = title;
    this.url = url;
    this.currentGuid = currentGuid;
    this.image = image;
  }

  async update() {
    const parsed = await parser.parseURL(this.url);
    const latest = parsed.items[0];
    const guid = latest.guid || latest.id;
    if (!this.currentGuid || this.currentGuid !== guid) {
      this.currentGuid = guid;
      await Source.findByIdAndUpdate(this.id, {
        currentGuid: this.currentGuid,
      });
      this.currentEp = latest;
      return true;
    } else {
      return;
    }
  }
}

module.exports = { Feed };
