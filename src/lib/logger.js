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
  level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
});

export default logger;
