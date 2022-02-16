const express = require('express');
const router = express.Router();
const graphHopperClient = require('./client');
const logger = require('../lib/logger');

const routes = [
  ['get', '/'],
  ['get', '/i18n'],
  ['get', '/i18n/:locale'],
  ['get', '/info'],
  ['get', '/isochrone'],
  ['get', '/isochrone-pt'],
  ['post', '/match'],
  ['get', '/mvt/:z/:x/:y.mvt'],
  ['get', '/nearest'],
  ['get', '/pt-mvt/:z/:x/:y.mvt'],
  ['get', '/route'],
  ['post', '/route'],
  ['get', '/route-pt'],
  ['get', '/spt'],
];

routes.forEach(([method, path]) => {
  router[method](path, async (req, res) => {
    try {
      const resp = await graphHopperClient.request({
        method: req.method.toLowerCase(),
        url: req.url
      });
      res.send(resp.data);
    } catch (error) {
      logger.error(error);
      if (error.response) {
        res.status(error.response.status).send(error.response.data);
      }
      else {
        res.status(500);
      }
      res.end();
    }
  });
});

module.exports = router;
