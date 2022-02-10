const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const httpLogger = require('pino-http')({
  transport: {
    target: 'pino-pretty'
  }
});
const logger = require('./lib/logger');
const {PORT: port} = require('./config');
const app = express();

const { router: graphHopperRouter } = require('./graphhopper');
const { router: photonRouter } = require('./photon');
const { router: nominatimRouter } = require('./nominatim');

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

app.use('/v1/graphhopper', graphHopperRouter);

app.use('/v1/photon', photonRouter);

app.use('/v1/nominatim', nominatimRouter);

// all routes that should be forwarded to graphhopper
app.use('/v1', graphHopperRouter);

// all routes that should be forwarded to graphhopper
app.use('/v2', photonRouter);

// all routes that should be forwarded to graphhopper
app.use('/v3', nominatimRouter);

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(0);
});

app.listen(port, () => {
  logger.info(`Example app listening at http://localhost:${port}`)
});

