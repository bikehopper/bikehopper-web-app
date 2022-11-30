const logger = require('pino')({
  transport: {
    target: 'pino-http-print'
  }
});

module.exports = logger;
