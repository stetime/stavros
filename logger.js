const { transports, createLogger, format } = require('winston');
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.splat(),
    format.simple(),
    format.json(),
    format.prettyPrint()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

module.exports = { logger };
