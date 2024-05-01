import express from 'express';
import { checkSchema, validationResult } from 'express-validator';
import realtimeClient from './client.js';
import cache from '../lib/cache.js';
import logger from '../lib/logger.js';
import {
  GTFS_REALTIME_ALERTS_URL,
  GTFS_REALTIME_VEHICLE_POSITIONS_URL,
  GTFS_REALTIME_TRIP_UPDATES_URL,
} from '../config.js';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

// const root = await protobuf.load('src/proto/gtfs-realtime.proto');

const vehiclePositionsUrl = GTFS_REALTIME_VEHICLE_POSITIONS_URL;
const serviceAlertsUrl = GTFS_REALTIME_ALERTS_URL;
const tripUpdatesUrl = GTFS_REALTIME_TRIP_UPDATES_URL;

const router = express.Router();

const validateQueryParams = () => checkSchema({
  'trip-id': {
    optional: true,
    isLength: {
      options: { 
        min: 3,
        max: 32
      },
    },
  },
  'route-id': {
    optional: true,
    isLength: {
      options: { 
        min: 3,
        max: 32
      },
    },
  }
}, ['query']);

function filterVehiclePositions(tripId, routeId, entities) {
  const filters = [{
    key: 'tripId',
    value: tripId
  },
  {
    key: 'routeId',
    value: routeId
  }].filter(filter => filter.value?.length);

  if (filters.length === 0) return entities;

  return filters.flatMap(filter => {
    return entities
      .filter(entity => {
        if (!entity.vehicle) return false;
        if (!entity.vehicle.trip) return false;
        return filter.value.includes(entity.vehicle.trip[filter.key]);
      });
  });
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

// ttl in ms
async function cacheableRequest(ttl, url) {
  try {
    const cachedData = await cache.get(url, {raw: true});
    if (cachedData) {
      return {
        value: cachedData.value,
        age: Math.floor((cachedData.expires - Math.floor(new Date().getTime())) / 1000)
      };
    }
  } catch (error) {
    logger.warn(`cache error: ${error}`);
  }
  
  const {data: value} = await realtimeClient.get(url, {
    responseType: 'arraybuffer'
  });

  try {
    await cache.set(url, value, ttl);
  } catch (error) {
    logger.error(`cache error: ${error}`);
  }
  
  return {
    value,
    age: ttl / 1000
  };
}

async function vehiclePositionsCb (req, res) {
  if (!vehiclePositionsUrl) {
    logger.info('env var GTFS_REALTIME_VEHICLE_POSITIONS_URL not found');
    res.sendStatus(404);
    res.end();
    return;
  }

  const validatationResult = validationResult(req);
  if (!validatationResult.isEmpty()) {
    res.header('Cache-Control', 'no-store');
    res.status(400);
    res.json({ errors: validatationResult.array() });
    return;
  }

  res.header('Cache-Control', 'max-age=60, public');
  
  // get data from realtime gtfs upstream
  let vehiclePosition;
  try {
    vehiclePosition = await cacheableRequest(60000, vehiclePositionsUrl);
  } catch (error) {
    logger.error(`error fetching vehicle positions ${error}`);
    res.header('Cache-Control', 'no-store');
    if (error.response) {
      res.sendStatus(error.response.status);
    }
    else {
      res.sendStatus(500);
    }
    return;
  }

  // decode protobuffer
  let vehiclePositionsAll;
  try {
    vehiclePositionsAll = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      Buffer.from(vehiclePosition.value)
    );
  } catch (error) {
    logger.error(`Error decoding vehicle position protobuff: ${error}`);
    res.header('Cache-Control', 'no-store');
    res.sendStatus(500);
    return;
  }

  // filter undesired trips/routes
  const vehiclePositionsFiltered = {
    header: vehiclePositionsAll.header,
    entity: filterVehiclePositions(req.query['trip-id'], req.query['route-id'], vehiclePositionsAll.entity),
  };

  // send response in correct format
  res.header('Age', vehiclePosition.age);
  switch(req.accepts(['application/x-protobuf', 'application/json'])) {
    case 'application/x-protobuf':
      const encodedProtoBuf = GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(vehiclePositionsFiltered).finish();
      res.header('Content-Type', 'application/x-protobuf');
      res.send(encodedProtoBuf);
      break;
    case 'application/json':
      res.json(vehiclePositionsFiltered);
      break;
    default: // 400 must use Accepts header
      res.sendStatus(400);
      break;
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

router.get('/vehiclepositions', validateQueryParams(), vehiclePositionsCb);
router.get('/servicealerts', serviceAlertsCb);
router.get('/tripupdates', tripUpdatesCb);

export default router;
