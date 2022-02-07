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

// all routes that should be forwarded to graphhopper
app.use('/v1', graphHopperRouter);

// all routes that should be forwarded to graphhopper
app.use('/v2', photonRouter);

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(0);
});

app.listen(port, () => {
  logger.info(`Example app listening at http://localhost:${port}`)
});

