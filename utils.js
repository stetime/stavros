module.exports.randomTime = (min, max) => Math.floor(Math.random() * max + min);
module.exports.hourToMs = (hr) => hr * (3600 * 1000);
module.exports.sanitise = (str) => str.replace(/(<([^>]+)>)/gi, '');
