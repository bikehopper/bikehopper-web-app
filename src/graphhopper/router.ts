import express from 'express';
import graphHopperClient from './client.js';
import logger from '../lib/logger.js';
import * as gtfsRtClient from '../gtfs-rt/client.js';
import { mergeAlertsIntoRoutes } from '../gtfs-rt/alerts.js';
import { replacePtRouteLinesWithHighres } from '../lib/route-linestring.js';
import { mergeElevatorInfoIntoRoutes } from '../lib/elevators.js';
import type { RouteResponse } from './types.js';

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

    const [alertResult, graphHopperResult] = await Promise.allSettled([
      alertPromise, graphHopperPromise
    ]);

    if (graphHopperResult.status === 'rejected') throw graphHopperResult.reason;

    let alerts: gtfsRtClient.GtfsRealtimeAlert[] | null = null;
    if (alertResult.status === 'rejected') {
      logger.error(alertResult.reason);
    } else {
      alerts = alertResult.value;
    }

    const routesWithAlerts = mergeAlertsIntoRoutes(alerts , graphHopperResult.value.data as RouteResponse | null);
    res.json(
      mergeElevatorInfoIntoRoutes(
        replacePtRouteLinesWithHighres(routesWithAlerts)
      )
    );
  } catch (error) {
    logger.error(error);
    if ((error as any).response) {
      res.status((error as any).response.status).send((error as any).response.data);
    }
    else {
      res.status(500);
    }
  } finally {
    res.end();
  }
});



const passthruRoutes: Array<['get' | 'post', string]> = [
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
        method: req.method.toLowerCase(),
        url: req.url
      });
      res.send(resp.data);
    } catch (error) {
      logger.error(error);
      if ((error as any).response) {
        res.status((error as any).response.status).send((error as any).response.data);
      }
      else {
        res.status(500);
      }
      res.end();
    }
  });
});

export default router;
