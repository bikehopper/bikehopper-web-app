import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import logger from '../lib/logger.js';

import { lineSlice } from '@turf/line-slice';
import { lineString, point } from '@turf/helpers';
import { WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH } from '../config.js';

let lookupTables = null;

// TODO: change to envvar
const ROUTELINE_LOOKUP_PATH = join(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, '/oute-line-lookup.json');

export async function loadLookupTables() {
  try {
    const contents = await readFile(resolve(ROUTELINE_LOOKUP_PATH), { encoding: 'utf8' });
    lookupTables = JSON.parse(contents);
    logger.info('Loaded lookup tables for generated highres routelines');
  } catch (err) {
    logger.warn('Error occured when attempting to load routlines lookup tables into memory.');
    logger.warn('High res routlines will not be generated');
  }
}

export function replacePtRoutlinesWithHighres(routes) {
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
        const shapeId = stopTripShapeLookup[routeId][tripId];
        const shape = shapeIdLineStringLookup[shapeId];

        if (shape) {
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
