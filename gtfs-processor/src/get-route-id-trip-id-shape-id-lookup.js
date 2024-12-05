const { createReadStream } = require('node:fs');
const { resolve } = require("path");
const { parse } = require('csv-parse');

async function getRouteTripShapeLookup(unzippedGtfsPath) {
  const tripsStream = createReadStream(resolve(unzippedGtfsPath, 'trips.txt'), {encoding: 'utf8'});
  const parser = tripsStream.pipe(parse({columns: true}));

  const table = {};

  for await(const trip of parser) {
    const routeId = trip['route_id'];
    const tripId = trip['trip_id'];
    const shapeId = trip['shape_id'];

    if (routeId && tripId && shapeId) {
      // Lazily init the first level of the dictionary
      if (table[routeId] == null) {
        table[routeId] = {};
      }

      table[routeId][tripId] = shapeId;
    }
  }

  return table;
}

module.exports = {
  getRouteTripShapeLookup,
};
