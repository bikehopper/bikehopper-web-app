import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import pinoHttp from 'pino-http';
import { satisfies } from 'compare-versions';

import logger from './lib/logger.js';
import { WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, PORT as port } from './config.js';

import { router as graphHopperRouter } from './graphhopper/index.js';
import { router as photonRouter } from './photon/index.js';
import { router as nominatimRouter } from './nominatim/index.js';
import { router as geoConfigRouter } from './geoconfig/index.js';
import { router as realtimeRouter } from './realtime-gtfs/index.js';
import { loadLookupTables } from './lib/route-linestring.js';
import path from 'path';


async function initApp() {
  if (!satisfies(process.version, '>=18')) {
    console.error('ERROR: bikehopper-web-app requires node v18');
    process.exit(1);
  }
  
  const httpLogger = pinoHttp({
    logger: logger,
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
  
  // Load lookup tables for routeline clipping into memory
  await loadLookupTables();
  
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
  
  // return instance specific configs (e.g. map center, bbox, etc...)
  app.use('/v1/config', geoConfigRouter);
  app.use('/api/v1/config', geoConfigRouter);
  
  app.use('/v1/realtime', realtimeRouter);
  app.use('/api/v1/realtime', realtimeRouter);
  
  // generic API path so we don't have a leaky abstraction
  app.use('/v1/route', graphHopperRouter);
  app.use('/api/v1/route', graphHopperRouter);
  
  // all routes that should be forwarded to photon
  app.use('/v1/geocode', photonRouter);
  app.use('/api/v1/geocode', photonRouter);
  
  // all routes that should be forwarded to graphhopper
  // TODO: remove in next release
  app.use('/v1/graphhopper', graphHopperRouter);
  app.use('/api/v1/graphhopper', graphHopperRouter);
  
  // all routes that should be forwarded to photon
  // TODO: remove in next release
  app.use('/v1/photon', photonRouter);
  app.use('/api/v1/photon', photonRouter);
  
  // all routes that should be forwarded to nominatim
  // TODO: remove in next release
  app.use('/v1/nominatim', nominatimRouter);
  app.use('/api/v1/nominatim', nominatimRouter);

  // Add headers so mapliber-gl decodes protobufs appropriately
  const staticTilesOpts = { 
    setHeaders: (res, _u1, _u2) => {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/x-protobuf');
    },
  };

  // Expose static endpoint for tileset containing route-lines
  const routeTiles = express.static(
    path.join(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, 'route-tiles'),
    staticTilesOpts
  );
  app.use('/v1/route-tiles', routeTiles);
  app.use('/api/v1/route-tiles', routeTiles);
  
  // Expose static endpoint for tileset containing stop points
  const stopTiles = express.static(
    path.join(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, 'stop-tiles'),
    staticTilesOpts
  );
  app.use('/v1/stop-tiles', stopTiles);
  app.use('/api/v1/stop-tiles', stopTiles);

  process.on('SIGINT', function() {
    logger.info( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    // some other closing procedures go here
    process.exit(0);
  });
  
  process.on('SIGTERM', function() {
    logger.info( "\nGracefully shutting down from SIGTERM (Ctrl-C)" );
    // some other closing procedures go here
    process.exit(0);
  });
  
  app.listen(port, () => {
    logger.info(`listening at http://localhost:${port}`)
  });
}  
initApp().catch((e) => {
  console.error(e);
  process.exit(1)
});
