import pino from 'pino';

const debugMode = process.env.NODE_ENV !== 'production';

const logger = pino({
  transport: debugMode ? {
    target: 'pino-http-print',
    options: {
      all: true,
      translateTime: true,
    },
  } : null,
});

export default logger;
