const logger = require('pino')({
  transport: {
    target: 'pino-pretty'
  }
});

module.exports = logger;
