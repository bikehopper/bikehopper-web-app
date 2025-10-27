import express from 'express';
import { checkSchema, validationResult } from 'express-validator';
import { vehiclePositionClient, tripUpdateClient } from './client.js';
import cache from '../lib/cache.js';
import logger from '../lib/logger.js';
import {
  GTFS_REALTIME_VEHICLE_POSITIONS_URL,
  GTFS_REALTIME_TRIP_UPDATES_URL,
} from '../config.js';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const vehiclePositionsUrl = GTFS_REALTIME_VEHICLE_POSITIONS_URL;
const tripUpdatesUrl = GTFS_REALTIME_TRIP_UPDATES_URL;

const router = express.Router();

const validateQueryParams = () => checkSchema({
  'trip-id': {
    optional: true,
    trim: true,
    isLength: {
      options: { 
        min: 3,
        max: 64
      },
    },
  },
  'route-id': {
    optional: true,
    trim: true,
    isLength: {
      options: { 
        min: 3,
        max: 64
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
        if (!entity.tripUpdate) return false;
        if (!entity.tripUpdate.trip) return false;
        return filter.value.includes(entity.tripUpdate.trip[filter.key]);
      });
  });
}

// ttl in ms
async function cacheableRequest(ttl, url, client) {
  try {
    const cachedData = await cache.get(url, {raw: true});
    if (cachedData) {
      logger.debug(`cache hit: ${url}`);
      return {
        value: cachedData.value,
        age: Math.floor((cachedData.expires - Math.floor(new Date().getTime())) / 1000)
      };
    }
  } catch (error) {
    logger.warn(`cache error: ${error}`);
  }
  
  const {data: value} = await client.get(url, {
    responseType: 'arraybuffer',
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

  const validations = validationResult(req);
  if (!validations.isEmpty()) {
    res.header('Cache-Control', 'no-store');
    res.status(400);
    res.json({ errors: validations.array() });
    return;
  }

  res.header('Cache-Control', 'max-age=60, public');
  
  // get data from realtime gtfs upstream
  let vehiclePosition;
  try {
    vehiclePosition = await cacheableRequest(60000, vehiclePositionsUrl, vehiclePositionClient);
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
      res.header('Content-Type', 'application/x-protobuf');
      res.send(GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(vehiclePositionsFiltered).finish());
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

async function tripUpdatesCb (req, res) {
  if (!tripUpdatesUrl) {
    logger.info('env var GTFS_REALTIME_TRIP_UPDATES_URL not found');
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
  let tripUpdates;
  try {
    tripUpdates = await cacheableRequest(60000, tripUpdatesUrl, tripUpdateClient);
  } catch (error) {
    logger.error(`error fetching trip updates ${error}`);
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
  let tripUpdatesAll;
  try {
    tripUpdatesAll = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      Buffer.from(tripUpdates.value)
    );
  } catch (error) {
    logger.error(`Error decoding trip updates protobuff: ${error}`);
    res.header('Cache-Control', 'no-store');
    res.sendStatus(500);
    return;
  }

  // filter undesired trips/routes
  const tripUpdatesFiltered = {
    header: tripUpdatesAll.header,
    entity: filterTripUpdates(req.query['trip-id'], req.query['route-id'], tripUpdatesAll.entity),
  };

  // send response in correct format
  res.header('Age', tripUpdates.age);
  switch(req.accepts(['application/x-protobuf', 'application/json'])) {
    case 'application/x-protobuf':
      res.header('Content-Type', 'application/x-protobuf');
      res.send(GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(tripUpdatesFiltered).finish());
      break;
    case 'application/json':
      res.json(tripUpdatesFiltered);
      break;
    default: // 400 must use Accepts header
      res.sendStatus(400);
      break;
  }
  res.end();
}

router.get('/vehiclepositions', validateQueryParams(), vehiclePositionsCb);
router.get('/tripupdates', validateQueryParams(), tripUpdatesCb);

export default router;
