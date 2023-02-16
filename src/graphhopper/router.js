import express from 'express';
import graphHopperClient from './client.js';
import logger from '../lib/logger.js';

const router = express.Router();
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

router.use((req, res, next) => {
  // you only want to cache for GET requests
  if (req.method == 'GET') {
    res.set('Cache-Control', 'public, max-age=120');
  } else {
    // for the other requests set strict no caching parameters
    res.set('Cache-Control', `no-store`);
  }
  next();
});

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

export default router;
