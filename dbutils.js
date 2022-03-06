if (process.env.NODE_ENV != 'production') require('dotenv').config();
const { connectionString } = process.env;
const mongoose = require('mongoose');
mongoose.connect(connectionString);
const db = mongoose.connection;
const Source = require('./models/sources');
const Parser = require('rss-parser');
const parser = new Parser();

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => {
  console.log('database connected');
});

async function addFeed(url) {
  const feed = await parser.parseURL(url);
  const image = feed.image
    ? feed.image.url
    : 'https://thestandnyc.com/images/comedians/_square/adam.jpg';
  if (feed.title) {
    await new Source({
      url: url,
      title: feed.title,
      image: image,
    }).save();
    console.log(`${url} saved to the db.`);
  }
}
