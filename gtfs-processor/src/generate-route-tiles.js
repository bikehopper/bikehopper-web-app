import { existsSync } from 'node:fs';
import { appendFile, unlink, rm } from 'node:fs/promises';
import { join } from 'path';
import { lineString, point } from '@turf/helpers';
import { getRoutes, getStops } from 'gtfs';

import runTippecanoe  from '@bikehopper/node-tippecanoe';


/**
 * Given a row of route, finds the corresponding shapes from the shapes lookup tables.
 * Then appends the shape into a line-delimited geojson file as a LineString.
 * 
 * @param {Object} route Route object parsed from a row of `routes.txt`
 * @param {string} ldGeoJsonPath filepath to the LDGeoJSON file for output features
 * @param {Object} routelineLookups Lookup table for shapes
 */
async function appendRouteLineStringToFile(
  route,
  ldGeoJsonPath,
  routelineLookups, 
) {
  const { routeTripShapeLookup, shapeIdLineStringLookup } = routelineLookups;

  const routeId = route['route_id'];
  const routeColor = route['route_color'];
  const routeTextColor = route['route_text_color'];

  const trips = routeTripShapeLookup[routeId];
  if (trips) {
    const seenShapes = new Map();
    for (const tripId of Object.keys(trips)) {
      const shapeId = trips[tripId];
      const shape = shapeIdLineStringLookup[shapeId];
      if (shape) {
        if (!seenShapes.has(shapeId)) {
          // First time seeing this shape, so create the GeoJSON lineString
          const geojson = lineString(shape, {
            route_id: routeId,
            trip_ids: tripId, // comma-seperated list of trip-ids, MVT doesn't support arrays
            route_color: routeColor ? `#${routeColor}` : null,
            route_text_color: routeTextColor ? `#${routeTextColor}` : null,
          });
          seenShapes.set(shapeId, geojson);
        } else {
          // Seeing the same again, but for different trip, so add this trip-id to its trip_ids prop
          const geojson = seenShapes.get(shapeId);   
          geojson.properties.trip_ids += `,${tripId}`;
        }
      }
    }
    
    for(const routeLineString of seenShapes.values()) {
      await appendFile(ldGeoJsonPath, JSON.stringify(routeLineString)+'\n');
    }
  }
}

/**
 * Appends all the stops to the LDGeoJson file
 * 
 * @param {*} stops
 * @param {*} ldGeoJsonPath 
 * @param {*} routeLineLookups 
 * @param {*} routeTypeLookup
 */
async function appendStops(stops, ldGeoJsonPath, routeLineLookups, routeTypeLookup) {
  // taken from https://gtfs.org/documentation/schedule/reference/#routestxt
  const ROUTE_TYPE_TO_STRING = {
    0: 'tram',
    1: 'subway',
    2: 'rail',
    3: 'bus',
    4: 'ferry',
    5: 'cable',
    6: 'aerial',
    7: 'funicular',
    11: 'trolleybus',
    12: 'monorail',
  };

  // Helper function that uses the lookup tables to infer all the route-types that are accesible at a stop
  const getRouteTypesForStop = (stopId) => {
    const { tripRouteLookup, stopIdTripIdsLookup } = routeLineLookups;
    const tripsForStop = stopIdTripIdsLookup.get(stopId);
    // Use set to de-dup route-types
    const routeTypes = new Set();
    if (tripsForStop && tripsForStop.size > 0) {

      // Loop over all trips at that stop
      for (const tripId of tripsForStop.values()) {
        const routeIds = tripRouteLookup.get(tripId);

        if (routeIds && routeIds.size > 0) {

          // Loop over all the routes on that trip
          for (const routeId of routeIds.values()) {

            // Add all the route-types for each route into a set
            if (routeTypeLookup.has(routeId)) {
              routeTypes.add(ROUTE_TYPE_TO_STRING[routeTypeLookup.get(routeId)]);
            }
          }
        }
      }
    }

    return routeTypes;
  };

  for (const stop of stops) {
    const stopId = stop['stop_id'];
    const stopName = stop['stop_name'];
    const lat = parseFloat(stop['stop_lat']);
    const lon = parseFloat(stop['stop_lon']);

    if (!isNaN(lat) && !isNaN(lon) && !!stopId) {
      const properties = {
        stop_name: stopName,
        stop_id: stopId,
      };
      if (stop['parent_station']) {
        const parentStop = getStops({stop_id: stop['parent_station']})[0];
        if (parentStop?.stop_name) {
          properties.stop_name = parentStop.stop_name;
        }
      }
      const routeTypesAtStop = getRouteTypesForStop(stopId);
      if (routeTypesAtStop.size > 0) {
        for (const routeType of routeTypesAtStop.values()) {
          properties[routeType] = true;
        }

        const geojson = point([lon, lat], properties);

        await appendFile(ldGeoJsonPath, JSON.stringify(geojson)+'\n');
      }
    }
  }
}

export default async function generateRouteTiles(
  routelineLookups,
  outputPath,
) {
  const routeLinesLDGeoJsonPath = join(outputPath, 'routelines.ldgeojson');
  if (existsSync(routeLinesLDGeoJsonPath)) {
    await unlink(routeLinesLDGeoJsonPath);
  }

  const stopLDGeoJsonPath = join(outputPath, 'stops.ldgeojson');
  if (existsSync(stopLDGeoJsonPath)) {
    await unlink(stopLDGeoJsonPath);
  }
  
  console.log('Starting creation of LDGeoJSON');
  const routes = getRoutes();
  const routeTypes = new Map();
  for (const route of routes) {
    await appendRouteLineStringToFile(route, routeLinesLDGeoJsonPath, routelineLookups);

    const routeId = route['route_id'];
    const routeType = parseInt(route['route_type']);
    if (!isNaN(routeType)) {
      routeTypes.set(routeId, routeType);
    }
  }
  console.log('Finished adding route LineStrings LDGeoJSON');

  await appendStops(getStops(), stopLDGeoJsonPath, routelineLookups, routeTypes);

  console.log('Finished addings stop points to LDGeoJSON');

  const routeTilesPath = join(outputPath, 'route-tiles');
  if (existsSync(routeTilesPath)) {
    await rm(routeTilesPath, {recursive: true});
  }

  const stopTilesPath = join(outputPath, 'stop-tiles');
  if (existsSync(stopTilesPath)) {
    await rm(stopTilesPath, {recursive: true});
  }
  await runTippecanoe(routeLinesLDGeoJsonPath, routeTilesPath, 'route-lines', 7, true, false);
  await runTippecanoe(stopLDGeoJsonPath, stopTilesPath, 'stops', 8, false, true);
}
