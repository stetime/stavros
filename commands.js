const Games = require('./models/game');
const Name = require('./models/name');
const Adjective = require('./models/adjective');

const addName = async function (nick) {
  if (await Name.findOne({ body: nick })) {
    return;
  }
  const n = new Name({
    body: nick.toString(),
  });
  await n.save();
  return true;
};

const addPrefix = async function (prefix) {
  if (await Adjective.findOne({ body: prefix })) {
    return false;
  }
  const p = new Adjective({
    body: prefix.toString(),
  });
  await p.save();
  return true;
};

const addGame = async function (game) {
  if (await Games.findOne({ body: game })) {
    console.log(`dupe game ${game}`);
    return false;
  }
  const g = new Games({
    body: game.toString(),
  });
  await g.save();
  return true;
};

const addFeed = async function (url) {
  // if (await Source.findOne({ url: url })) {
  //   console.log(`dupe source: ${url}`);
  //   return false;
  // }
  // const f = new Feed({
  //   url: url.toString(),
  // });
  // await f.save();
  return url.toString();
};

module.exports = {
  addGame,
  addFeed,
  addName,
  addPrefix,
};
