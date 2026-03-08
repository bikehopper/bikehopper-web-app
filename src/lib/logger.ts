import pino from 'pino';

const transport =  {
  target: 'pino-http-print',
  options: {
    all: true,
    translateTime: true,
  },
};

export default pino({
  transport,
  level: process.env['LOG_LEVEL'] || 'info'
});
