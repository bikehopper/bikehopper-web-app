import { getTrips } from 'gtfs';
import type { RouteLinestringLookup } from '../../src/lib/types.js';

export default async function getRouteTripShapeLookup()
: Promise<{
  routeTripShapeLookup: RouteLinestringLookup['routeTripShapeLookup'], 
  tripRouteLookup: Map<string, Set<string>>,
}> {
  const routeTripShapeLookup: RouteLinestringLookup['routeTripShapeLookup'] = {};
  // Using a Map for trip-id: route-id[] because this one doesn't need to be serialized to disk
  const tripRouteLookup: Map<string, Set<string>> = new Map();

  for (const trip of getTrips({}, ['route_id', 'trip_id', 'shape_id'])) {
    const routeId = trip['route_id'];
    const tripId = trip['trip_id'];
    const shapeId = trip['shape_id'];

    if (routeId && tripId && shapeId) {
      // Lazily init the first level of the dictionaries
      if (routeTripShapeLookup[routeId] == null) {
        routeTripShapeLookup[routeId] = {};
      }

      const routesForTrip = tripRouteLookup.get(tripId);
      if (routesForTrip) {
        routesForTrip.add(routeId);
      } else {
        const newRoutesForTrip: Set<string> = new Set();
        newRoutesForTrip.add(routeId);
        tripRouteLookup.set(tripId, newRoutesForTrip);

      }
      
      routeTripShapeLookup[routeId][tripId] = shapeId;
    }
  }

  return {routeTripShapeLookup, tripRouteLookup};
}
