const Source = require('./models/sources');
const Parser = require('rss-parser');
const parser = new Parser();

class Feed {
  constructor() {
    this.url = '';
  }

  async update() {
    const parsed = await parser.parseURL(this.url);
    const latest = parsed.items[0];
    const guid = this.url.includes('youtube') ? latest.id : latest.guid;
    if (!this.currentGuid) {
      this.currentGuid = guid;
      await Source.findByIdAndUpdate(this.id, {
        currentGuid: this.currentGuid,
      });
      this.currentEp = latest;
      return true;
    } else if (this.currentGuid !== guid) {
      this.currentGuid = guid;
      await Source.findByIdAndUpdate(this.id, {
        currentGuid: this.currentGuid,
      });
      this.currentEp = latest;
      return true;
    } else {
      return false;
    }
  }
}

module.exports = { Feed };
