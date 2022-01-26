const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const httpLogger = require('pino-http')();
const logger = require('./lib/logger');
const {PORT: port} = require('./config');
const app = express();

const { router: graphHopperRouter } = require('./graphhopper');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// basic api hardening
app.use(helmet());

// http req logging
app.use((req, res, next) => {
  httpLogger(req, res);
  next();
});

// used by k8s for health checks
app.get('/health', (req, res) => {
  res.sendStatus(200);
  res.end();
});

// all routes that should be forwarded to graphhopper
app.use('/api/v1/bikehopper', graphHopperRouter);

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(0);
});

app.listen(port, () => {
  logger.info(`Example app listening at http://localhost:${port}`)
});

