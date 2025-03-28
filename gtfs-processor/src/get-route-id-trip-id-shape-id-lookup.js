const { createReadStream } = require('node:fs');
const { resolve } = require("path");
const { parse } = require('csv-parse');

async function getRouteTripShapeLookup(unzippedGtfsPath) {
  const tripsStream = createReadStream(resolve(unzippedGtfsPath, 'trips.txt'), {encoding: 'utf8'});
  const parser = tripsStream.pipe(parse({columns: true}));

  const routeTripShapeLookup = {};
  // Using a Map for trip-id: route-id[] because this one doesn't need to be serialized to disk
  const tripRouteLookup = new Map();

  for await(const trip of parser) {
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

module.exports = {
  getRouteTripShapeLookup,
};
