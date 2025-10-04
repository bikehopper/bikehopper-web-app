import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import logger from './logger.js';

import { lineSlice } from '@turf/line-slice';
import { lineString, point } from '@turf/helpers';
import { GEO_CONFIG_FOLDER_PATH } from '../config.js';

let lookupTables = null;

export async function loadLookupTables() {
  try {
    const ROUTELINE_LOOKUP_PATH = join(GEO_CONFIG_FOLDER_PATH, 'route-line-lookup.json');
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

  const routesCopy = JSON.parse(JSON.stringify(routes));
  const {
    routeTripShapeLookup,
    shapeIdLineStringLookup,
    tripIdStopIdsLookup,
  } = lookupTables;

  for (const path of routesCopy.paths) {
    for (const leg of path.legs) {
      if (leg.type === 'pt'){
        const startStop = leg.stops[0];
        const endStop = leg.stops[leg.stops.length -1];

        const routeId = leg['route_id'];
        const tripId = leg['trip_id'];
        const shapeIdsForRoute = routeTripShapeLookup[routeId];
        leg['all_stop_ids'] = tripIdStopIdsLookup[tripId];

        if (shapeIdsForRoute) {
          const shapeId = shapeIdsForRoute[tripId];
          const shape = shapeIdLineStringLookup[shapeId];
  
          if (shape) {
            try {
              const fullLineString = lineString(shape);
      
              const startPoint = point(startStop.geometry.coordinates);
              const endPoint = point(endStop.geometry.coordinates);
              const slicedLine = lineSlice(startPoint, endPoint, fullLineString);
              leg['geometry'] = slicedLine.geometry;
              
            } catch (e) {
              logger.error('Error occurred while trying to clip route linestring');
              logger.error(e);
              return routes;
            }
          }
        }
      }
    }
  }

  return routesCopy;
}
