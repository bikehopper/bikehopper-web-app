import { URL } from 'node:url';
import express from 'express';
import realtimeClient from './client.js';
import cache from '../lib/cache.js';
import logger from '../lib/logger.js';
import {
  GTFS_REALTIME_ALERTS_URL,
  GTFS_REALTIME_VEHICLE_POSITIONS_URL,
  GTFS_REALTIME_TRIP_UPDATES_URL,
} from '../config.js';

const vehiclePositionsUrl = new URL(GTFS_REALTIME_VEHICLE_POSITIONS_URL);
// const serviceAlertsUrl = new URL(GTFS_REALTIME_ALERTS_URL);
// const tripUpdatesUrl = new URL(GTFS_REALTIME_TRIP_UPDATES_URL);

const router = express.Router();

async function vehiclePositionsCb (req, res) {
  // try to get data from cache
  try {
    const cacheResult = await cache.get('vehiclePositions', {raw: true});
    if (cacheResult) {
      res.header({
        'X-Cache-Hit': true,
        'Cache-Control': 'public, max-age=60',
        'Age': (cacheResult.expires - Math.floor(new Date().getTime())) / 1000
      });

      res.json(cacheResult.value);
      return;
    }
  } catch (error) {
    logger.error(`cache error: ${error}`);
  }
  
  // set cache header to false
  res.header('X-Cache-Hit', 'false');
  
  // try to get data from realtime gtfs upstream
  try {
    const resp = await realtimeClient.request({
      method: 'get',
      url: vehiclePositionsUrl
    });

    // cache result from upstream
    try {
      const x = await cache.set('vehiclePositions', resp.data, 60000); // cache for 60 seconds
      console.log(x);
    } catch (error) {
      logger.error(`cache error: ${error}`);
    }
    
    // set cache headers and send result
    res.header({
      'Cache-Control': 'public, max-age=60',
      'Age': 0
    });
    res.json(resp.data);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
}

// only add vehicle position endpoint if the GTFS_REALTIME_VEHICLE_POSITIONS_URL env var is set
if (vehiclePositionsUrl) {
  router.get('/vehiclepositions', vehiclePositionsCb);
}



export default router;
