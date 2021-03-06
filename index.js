process.env.NODE_ENV !== 'production' &&
  require('dotenv').config({ path: `./.local_env` });
const { Client, Intents, MessageEmbed } = require('discord.js');
const { Feed } = require('./rss');
const { token, guildId, channelId } = process.env;
const embed = new MessageEmbed();
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const { randomTime, hourToMs, sanitise } = require('./utils');
const { Nick, Game } = require('./generators');
const { addName, addPrefix, addGame } = require('./commands');
const Source = require('./models/sources');
const { TwitterApi } = require('twitter-api-v2');
const userClient = new TwitterApi(
  ({ appKey, appSecret, accessToken, accessSecret } = process.env)
);
const { logger } = require('./logger');
const mongoose = require('mongoose');
const { connectionString } = process.env;
mongoose.connect(connectionString);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => {
  logger.info('database connected');
});

const nick = new Nick();
const game = new Game();
const sourceList = [];

async function tweetnick(nick) {
  await userClient.v1.tweet(nick.name);
}

async function bootFeeds() {
  const sources = await Source.find({});
  sources.forEach((source) => {
    let { id, title, url, currentGuid, image } = source;
    const feed = new Feed(id, title, url, currentGuid, image);
    sourceList.push(feed);
  });
}

async function nickgen() {
  try {
    const guild = client.guilds.cache.get(guildId);
    await nick.generator();
    while (nick.name.length > 32) {
      logger.info(`generated nick "${nick.name}" is over discord limit. `);
      await nick.generator();
      if (nick.name.length <= 32) {
        break;
      }
    }
    guild.me.setNickname(nick.name);
    logger.debug(`generated nick: ${nick.name}`);
    process.env.NODE_ENV === 'production' && tweetnick(nick);
    setTimeout(nickgen, randomTime(hourToMs(4), hourToMs(5)));
  } catch (err) {
    logger.error(err);
  }
}

async function gamegen() {
  const gen = await game.generator();
  client.user.setActivity(gen, { type: 'PLAYING' });
  logger.debug(`generated game: ${gen}`);
  setTimeout(gamegen, randomTime(hourToMs(2), hourToMs(5)));
}

async function broadcast() {
  for (source of sourceList) {
    try {
      if (await source.update()) {
        logger.info(
          `source update: ${source.title}: ${source.currentEp.title}`
        );
        const channel = client.channels.cache.get(channelId);
        if (source.url.includes('youtube')) {
          channel.send(source.currentEp.link);
        } else {
          embed.setTitle(source.currentEp.title);
          embed.setURL(source.currentEp.enclosure.url || source.currentEp.link);
          embed.setThumbnail(source.image);
          embed.setDescription(sanitise(source.currentEp.contentSnippet));
          embed.setAuthor({ name: source.title });
          channel.send({ embeds: [embed] });
        }
      }
    } catch (err) {
      logger.error(err);
    }
  }
}

client.on('ready', async () => {
  logger.info('connected to discord');
  await bootFeeds();
  const interval = process.env.NODE_ENV === 'production' ? 4 : 0.2;
  setInterval(broadcast, hourToMs(interval));
  nickgen();
  gamegen();
  logger.debug(sourceList);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;
  if (commandName === 'addname') {
    const name = await interaction.options.getString('input');
    (await addName(name))
      ? await interaction.reply(`added name: ${name} to the db`)
      : await interaction.reply(`the name ${name} already exists in the db`);
  }
  if (commandName === 'addprefix') {
    const prefix = await interaction.options.getString('input');
    (await addPrefix(prefix))
      ? await interaction.reply(`added prefix: ${prefix} to the db`)
      : await interaction.reply(`the prefix ${prefix} already exists`);
  }
  if (commandName === 'addgame') {
    const game = await interaction.options.getString('input');
    (await addGame(game))
      ? await interaction.reply(`added ${game} to the db`)
      : await interaction.reply(`${game} is already in the db`);
  }
});

client.login(token);
