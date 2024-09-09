import express from 'express';
import graphHopperClient from './client.js';
import logger from '../lib/logger.js';
import * as gtfsRtClient from '../gtfs-rt/client.js';
import { mergeAlertsIntoRoutes } from '../gtfs-rt/alerts.js';

const router = express.Router();
router.use((req, res, next) => {
  // you only want to cache for GET requests
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=120');
  } else {
    // for the other requests set strict no caching parameters
    res.set('Cache-Control', `no-store`);
  }
  next();
});

router.get('/route-pt', async (req, res) => {
  try {
    const alertPromise = gtfsRtClient.getAlerts();
    const graphHopperPromise = graphHopperClient.request({
      method: 'get',
      url: req.url,
    });
    const bikeRoutePromise = graphHopperClient.post('/route', {
      profile: 'bike2',
      locale: 'en-US',
      elevation: true,
      useMiles: false,
      layer: 'OpenStreetMap',
      pointsEncoded: false,
      details: ['cycleway', 'road_class', 'street_name'],
      points: req.query.point.map(latlng => latlng.split(',').reverse().map(point => parseFloat(point))) // turning [['1.2,3.4'],['5.6,7.8']] -> [[3.4, 1.2], [7.8, 5.6]]
    });

    const [alertResult, graphHopperResult, bikeRouteResult] = await Promise.allSettled([
      alertPromise, graphHopperPromise, bikeRoutePromise
    ]);

    if (graphHopperResult.status === 'rejected') throw graphHopperResult.reason;
    if (alertResult.status === 'rejected') logger.error(alertResult.reason);
    if (bikeRouteResult.status === 'rejected') logger.error(bikeRouteResult.reason.message);

    if (bikeRouteResult.status !== 'rejected' && bikeRouteResult.value?.data?.paths) {
      graphHopperResult.value.data.paths.push(...bikeRouteResult.value.data.paths);
    }

    res.json(mergeAlertsIntoRoutes(alertResult.value, graphHopperResult.value.data));
  } catch (error) {
    logger.error(error);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    }
    else {
      res.status(500);
    }
  } finally {
    res.end();
  }
});

const passthruRoutes = [
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
  // route-pt is handled above
  ['get', '/spt'],
];

passthruRoutes.forEach(([method, path]) => {
  router[method](path, async (req, res) => {
    try {
      const resp = await graphHopperClient.request({
        method: method,
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
