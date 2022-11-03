const randomTime = (min, max) => Math.floor(Math.random() * max + min)
const hourToMs = (hr) => hr * (3600 * 1000)
const logger = require('consola')
logger.level = process.env.NODE_ENV === 'development' ? 5 : 3


function sanitise(str) {
  const escapeChars = { lt: '<', gt: '>', quot: '"', apos: '\'', amp: '&' }
  str = str.replace(/(<([^>]+)>)/gi, '')
  return str.replace(/&([^;]+);/g, function (entity, entityCode) {
    let match

    if (entityCode in escapeChars) {
      return escapeChars[entityCode]
    } else if ((match = entityCode.match(/^#x([\da-fA-F]+)$/))) {
      return String.fromCharCode(parseInt(match[1], 16))
    } else if ((match = entityCode.match(/^#(\d+)$/))) {
      return String.fromCharCode(~~match[1])
    } else {
      return entity
    }
  })
}

module.exports = {
  randomTime,
  hourToMs,
  sanitise,
  logger,
}
