const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const httpLogger = require('pino-http')({
  transport: {
    target: 'pino-http-print'
  }
});
const logger = require('./lib/logger');
const {PORT: port} = require('./config');
const app = express();

const { router: graphHopperRouter } = require('./graphhopper');
const { router: photonRouter } = require('./photon');
const { router: nominatimRouter } = require('./nominatim');
const { router: fileRouter} = require('./file');

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

