import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';

import logger from './lib/logger.js';
import { PORT as port } from './config.js';

import { router as graphHopperRouter } from './graphhopper/index.js';
import { router as photonRouter } from './photon/index.js';
import { router as nominatimRouter } from './nominatim/index.js';
import { router as fileRouter } from './file/index.js';

const httpLogger = pinoHttp({
  transport: {
    target: 'pino-http-print'
  }
});
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// basic api hardening
app.use(helmet());

// used by k8s for health checks
app.get('/health', (req, res) => {
  res.sendStatus(200);
  res.end();
});

// http req logging
app.use((req, res, next) => {
  httpLogger(req, res);
  next();
});

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.set('access-control-allow-headers', '*');
    res.set('access-control-allow-origin', '*');
    res.set('access-control-allow-methods', '*');
  }

  // you only want to cache for GET requests
  if (req.method == 'GET') {
    res.set('Cache-Control', 'public, max-age=43200');
  } else {
    // for the other requests set strict no caching parameters
    res.set('Cache-Control', `no-store`);
  }
  next();
});

// all routes that should be forwarded to graphhopper
app.use('/v1/graphhopper', graphHopperRouter);

// all routes that should be forwarded to photon
app.use('/v1/photon', photonRouter);

// all routes that should be forwarded to the fit file creator
app.use('/v1/file', fileRouter);

// all routes that should be forwarded to nominatim
app.use('/v1/nominatim', nominatimRouter);

process.on('SIGINT', function() {
  logger.info( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(0);
});

app.listen(port, () => {
  logger.info(`listening at http://localhost:${port}`)
});

