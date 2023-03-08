import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-http-print'
  }
});

export default logger;
