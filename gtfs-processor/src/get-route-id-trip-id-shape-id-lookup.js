import { getTrips } from 'gtfs';

export default async function getRouteTripShapeLookup() {
  const routeTripShapeLookup = {};
  // Using a Map for trip-id: route-id[] because this one doesn't need to be serialized to disk
  const tripRouteLookup = new Map();

  for (const trip of getTrips({}, ['route_id', 'trip_id', 'shape_id'])) {
    const routeId = trip['route_id'];
    const tripId = trip['trip_id'];
    const shapeId = trip['shape_id'];

    if (routeId && tripId && shapeId) {
      // Lazily init the first level of the dictionaries
      if (routeTripShapeLookup[routeId] == null) {
        routeTripShapeLookup[routeId] = {};
      }
      if (!tripRouteLookup.has(tripId)) {
        tripRouteLookup.set(tripId, new Set());
      }

      routeTripShapeLookup[routeId][tripId] = shapeId;
      tripRouteLookup.get(tripId).add(routeId);
    }
  }

  return {routeTripShapeLookup, tripRouteLookup};
}
