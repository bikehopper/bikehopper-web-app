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
const serviceAlertsUrl = new URL(GTFS_REALTIME_ALERTS_URL);
const tripUpdatesUrl = new URL(GTFS_REALTIME_TRIP_UPDATES_URL);

const router = express.Router();

function filterVehiclePositions(tripId, routeId, entities) {
  const vehicleFilters = [{
    key: 'TripId',
    value: tripId
  },
  {
    key: 'RouteId',
    value: routeId
  }].filter(vehicleFilter => vehicleFilter.value)

  return vehicleFilters.reduce((entities, filter) => {
    return entities
      .filter(entity => entity.Vehicle.Trip)
      .filter(entity => entity.Vehicle.Trip[filter.key] === filter.value);
  }, entities);
}

function filterTripUpdates(tripId, routeId, entities) {
  const vehicleFilters = [{
    key: 'TripId',
    value: tripId
  },
  {
    key: 'RouteId',
    value: routeId
  }].filter(vehicleFilter => vehicleFilter.value)

  return vehicleFilters.reduce((entities, filter) => {
    return entities
      .filter(entity => entity.TripUpdate.Trip)
      .filter(entity => entity.TripUpdate.Trip[filter.key] === filter.value);
  }, entities);
}

async function vehiclePositionsCb (req, res) {
  const tripId = req.query.tripid;
  const routeId = req.query.routeid;

  // try to get data from cache
  try {
    const cacheResult = await cache.get('vehiclePositions', {raw: true});
    if (cacheResult) {
      res.header({
        'X-Cache-Hit': true,
        'Cache-Control': 'public, max-age=60',
        'Age': Math.floor((cacheResult.expires - Math.floor(new Date().getTime())) / 1000)
      });
      
      res.json(filterVehiclePositions(tripId, routeId, cacheResult.value.Entity));
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
    res.json(filterVehiclePositions(tripId, routeId, vehiclePositions.Entity));
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
  // try to get data from cache
  try {
    const cacheResult = await cache.get('serviceAlerts', {raw: true});
    if (cacheResult) {
      res.header({
        'X-Cache-Hit': true,
        'Cache-Control': 'public, max-age=60',
        'Age': Math.floor((cacheResult.expires - Math.floor(new Date().getTime())) / 1000)
      });

      res.json(cacheResult.value.Entity);
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
    res.json(serviceAlerts.Entity);
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
  const tripId = req.query.tripid;
  const routeId = req.query.routeid;
  // try to get data from cache
  try {
    const cacheResult = await cache.get('tripUpdates', {raw: true});
    if (cacheResult) {
      res.header({
        'X-Cache-Hit': true,
        'Cache-Control': 'public, max-age=60',
        'Age': Math.floor((cacheResult.expires - Math.floor(new Date().getTime())) / 1000)
      });

      res.json(filterTripUpdates(tripId, routeId, cacheResult.value.Entity));
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
    res.json(filterTripUpdates(tripId, routeId, tripUpdates.Entity));
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

// only add service alerts endpoint if the GTFS_REALTIME_ALERTS_URL env var is set
if (serviceAlertsUrl) {
  router.get('/servicealerts', serviceAlertsCb);
}

// only add trip updates endpoint if the GTFS_REALTIME_TRIP_UPDATES_URL env var is set
if (tripUpdatesUrl) {
  router.get('/tripupdates', tripUpdatesCb);
}

export default router;
