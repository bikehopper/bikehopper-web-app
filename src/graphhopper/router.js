const express = require('express');
const router = express.Router();
const graphHopperClient = require('./client');
const logger = require('../lib/logger');

const routes = [
  ['get', '/v1/'],
  ['get', '/v1/i18n'],
  ['get', '/v1/i18n/:locale'],
  ['get', '/v1/info'],
  ['get', '/v1/isochrone'],
  ['get', '/v1/isochrone-pt'],
  ['post', '/v1/match'],
  ['get', '/v1/mvt/:z/:x/:y.mvt'],
  ['get', '/v1/nearest'],
  ['get', '/v1/pt-mvt/:z/:x/:y.mvt'],
  ['get', '/v1/route'],
  ['post', '/v1/route'],
  ['get', '/v1/route-pt'],
  ['get', '/v1/spt'],
];

routes.forEach(([method, path]) => {
  router[method](path, async (req, res) => {
    logger.info(`req to ${req.path}`);
    try {
      const resp = await graphHopperClient.request({
        method: req.method.toLowerCase(),
        url: req.url
      });
      res.send(resp.data);
    } catch (error) {
      if (error.response) {
        if (error.response.status > 499) {
          logger.error(error);
        }
        res.sendStatus(error.response.status);
        res.send(error.response.data);
      }
      else {
        res.sendStatus(500);
      }
      res.end();
    }
  });
});

module.exports = router;
