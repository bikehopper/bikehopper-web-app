import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import logger from './logger.js';

import { lineSlice } from '@turf/line-slice';
import { lineString, point } from '@turf/helpers';
import { GEO_CONFIG_FOLDER_PATH } from '../consts.js';
import type { RouteResponse } from '../graphhopper/types.js';
import { RouteLinestringLookupParser, type RouteLinestringLookup } from './types.js';

let lookupTables: RouteLinestringLookup | null = null;

export async function loadLookupTables() {
  try {
    const ROUTELINE_LOOKUP_PATH = join(GEO_CONFIG_FOLDER_PATH, 'route-line-lookup.json');
    const contents = await readFile(resolve(ROUTELINE_LOOKUP_PATH), { encoding: 'utf8' });
    lookupTables = RouteLinestringLookupParser.parse(JSON.parse(contents));
    logger.info('Loaded lookup tables for generated highres routelines');
  } catch (err) {
    logger.warn('Error occured when attempting to load routlines lookup tables into memory.');
    logger.warn('High res routlines will not be generated');
    logger.warn(err);
  }
}

export function replacePtRouteLinesWithHighres(routes: RouteResponse | null): RouteResponse | null {
  if (routes == null || lookupTables == null) return routes;

  const routesCopy: RouteResponse = JSON.parse(JSON.stringify(routes));
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

        if (startStop != null && endStop != null) {
          const routeId = leg['route_id'];
          const tripId = leg['trip_id'];
          const shapeIdsForRoute = routeTripShapeLookup[routeId];

          const allStops = tripIdStopIdsLookup[tripId];
          if (allStops) {
            leg['all_stop_ids'] = allStops;
          }
  
          if (shapeIdsForRoute) {
            const shapeId = shapeIdsForRoute[tripId];
            const shape = shapeId ? shapeIdLineStringLookup[shapeId] : null;
    
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
  }

  return routesCopy;
}
