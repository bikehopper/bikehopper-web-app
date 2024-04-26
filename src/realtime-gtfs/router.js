import express from 'express';
import realtimeClient from './client.js';
import cache from '../lib/cache.js';
import logger from '../lib/logger.js';
import {
  GTFS_REALTIME_ALERTS_URL,
  GTFS_REALTIME_VEHICLE_POSITIONS_URL,
  GTFS_REALTIME_TRIP_UPDATES_URL,
} from '../config.js';

const vehiclePositionsUrl = GTFS_REALTIME_VEHICLE_POSITIONS_URL;
const serviceAlertsUrl = GTFS_REALTIME_ALERTS_URL;
const tripUpdatesUrl = GTFS_REALTIME_TRIP_UPDATES_URL;

const router = express.Router();

async function vehiclePositionsCb (req, res) {
  if (!vehiclePositionsUrl) {
    logger.info('env var GTFS_REALTIME_VEHICLE_POSITIONS_URL not found');
    res.sendStatus(404);
    res.end();
    return;
  }

  // try to get data from cache
  try {
    const cacheResult = await cache.get('vehiclePositions', {raw: true});
    if (cacheResult) {
      res.header({
        'X-Cache-Hit': true,
        'Cache-Control': 'public, max-age=60',
        'Age': Math.floor((cacheResult.expires - Math.floor(new Date().getTime())) / 1000)
      });
      
      res.send(cacheResult.value);
      res.end();
      return;
    }
  } catch (error) {
    logger.error(`cache error: ${error}`);
  }
  
  // set cache header to false
  res.header('X-Cache-Hit', 'false');
  
  // try to get data from realtime gtfs upstream
  try {
    const {data: vehiclePositions} = await realtimeClient.request({
      method: 'get',
      url: vehiclePositionsUrl
    });

    // cache result from upstream
    try {
      await cache.set('vehiclePositions', vehiclePositions, 60000); // cache for 60 seconds
    } catch (error) {
      logger.error(`cache error: ${error}`);
    }
    
    // set cache headers and send result
    res.header({
      'Cache-Control': 'public, max-age=60',
      'Age': 0
    });
    res.send(vehiclePositions);
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

async function serviceAlertsCb (req, res) {
  if (!serviceAlertsUrl) {
    logger.info('env var GTFS_REALTIME_ALERTS_URL not found');
    res.sendStatus(404);
    res.end();
    return;
  }

  // try to get data from cache
  try {
    const cacheResult = await cache.get('serviceAlerts', {raw: true});
    if (cacheResult) {
      res.header({
        'X-Cache-Hit': true,
        'Cache-Control': 'public, max-age=60',
        'Age': Math.floor((cacheResult.expires - Math.floor(new Date().getTime())) / 1000)
      });

      res.send(cacheResult.value);
      res.end()
      return;
    }
  } catch (error) {
    logger.error(`cache error: ${error}`);
  }
  
  // set cache header to false
  res.header('X-Cache-Hit', 'false');
  
  // try to get data from realtime gtfs upstream
  try {
    const {data: serviceAlerts} = await realtimeClient.request({
      method: 'get',
      url: serviceAlertsUrl
    });

    // cache result from upstream
    try {
      await cache.set('serviceAlerts', serviceAlerts, 60000); // cache for 60 seconds
    } catch (error) {
      logger.error(`cache error: ${error}`);
    }
    
    // set cache headers and send result
    res.header({
      'Cache-Control': 'public, max-age=60',
      'Age': 0
    });
    res.send(serviceAlerts);
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

async function tripUpdatesCb (req, res) {
  if (!tripUpdatesUrl) {
    logger.info('env var GTFS_REALTIME_TRIP_UPDATES_URL not found');
    res.sendStatus(404);
    res.end();
    return;
  }

  // try to get data from cache
  try {
    const cacheResult = await cache.get('tripUpdates', {raw: true});
    if (cacheResult) {
      res.header({
        'X-Cache-Hit': true,
        'Cache-Control': 'public, max-age=60',
        'Age': Math.floor((cacheResult.expires - Math.floor(new Date().getTime())) / 1000)
      });

      res.send(cacheResult.value);
      res.end();
      return;
    }
  } catch (error) {
    logger.error(`cache error: ${error}`);
  }
  
  // set cache header to false
  res.header('X-Cache-Hit', 'false');
  
  // try to get data from realtime gtfs upstream
  try {
    const {data: tripUpdates} = await realtimeClient.request({
      method: 'get',
      url: tripUpdatesUrl
    });

    // cache result from upstream
    try {
      await cache.set('tripUpdates', tripUpdates, 60000); // cache for 60 seconds
    } catch (error) {
      logger.error(`cache error: ${error}`);
    }
    
    // set cache headers and send result
    res.header({
      'Cache-Control': 'public, max-age=60',
      'Age': 0
    });
    res.send(tripUpdates);
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

router.get('/vehiclepositions', vehiclePositionsCb);
router.get('/servicealerts', serviceAlertsCb);
router.get('/tripupdates', tripUpdatesCb);

export default router;
