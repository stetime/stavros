const randomTime = (min, max) => Math.floor(Math.random() * max + min);
const hourToMs = (hr) => hr * (3600 * 1000);
const sanitise = (str) => str.replace(/(<([^>]+)>)/gi, '');

module.exports = {
  randomTime,
  hourToMs,
  sanitise,
};
