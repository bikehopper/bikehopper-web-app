import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import logger from './logger.js';

import { lineSlice } from '@turf/line-slice';
import { lineString, point } from '@turf/helpers';
import { WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH } from '../config.js';

import express from 'express';

let lookupTables = null;
export const tempRoutelineDebug = express.Router();

tempRoutelineDebug.get('/route-line-debug', async (req, res) => {
  try {
    res.json(lookupTables != null ? lookupTables : {lookupstables: null});
  } catch (error) {
    logger.error(error);
    res.status(500);
  } finally {
    res.end();
  }
});
export async function loadLookupTables() {
  try {
    const ROUTELINE_LOOKUP_PATH = join(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, 'route-line-lookup.json');
    const contents = await readFile(resolve(ROUTELINE_LOOKUP_PATH), { encoding: 'utf8' });
    lookupTables = JSON.parse(contents);
    logger.info('Loaded lookup tables for generated highres routelines');
  } catch (err) {
    logger.warn('Error occured when attempting to load routlines lookup tables into memory.');
    logger.warn('High res routlines will not be generated');
  }
}

export function replacePtRouteLinesWithHighres(routes) {
  if (lookupTables == null) return routes;

  const {
    stopTripShapeLookup,
    shapeIdLineStringLookup,
  } = lookupTables;

  for (const path of routes.paths) {
    for (const leg of path.legs) {
      if (leg.type === 'pt'){
        const startStop = leg.stops[0];
        const endStop = leg.stops[leg.stops.length -1];

        const routeId = leg['route_id'];
        const tripId = leg['trip_id'];
        logger.info(`Route id: ${routeId} Trip id: ${tripId}`);
        const shapeId = stopTripShapeLookup[routeId][tripId];
        logger.info(`ShapeId: ${shapeId}`);
        const shape = shapeIdLineStringLookup[shapeId];
        logger.info(shape);

        if (shape) {
          logger.info('Shape is nullish, not clippig');
          const fullLineString = lineString(shape);
  
          const startPoint = point(startStop.geometry.coordinates);
          const endPoint = point(endStop.geometry.coordinates);
          const slicedLine = lineSlice(startPoint, endPoint, fullLineString);
          leg['geometry'] = slicedLine.geometry;
        }
      }
    }
  }

  return routes;
}
