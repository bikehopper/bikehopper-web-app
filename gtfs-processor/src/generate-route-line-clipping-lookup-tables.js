const { writeFile } = require('node:fs/promises');
const { getRouteTripShapeLookup } = require('./get-route-id-trip-id-shape-id-lookup');
const { getShapesLookup } = require('./get-shapes-lookup');
const { resolve } = require("path");

/**
 * Computes 2 lookup tables:
 * 1. stopTripShapeLookup: 
 *    This is a two-level dictionary
 *    Level1 :
 *    Key is a stop-id, Value is the 2nd Level dictionary
 *       Level 2:
 *       Key is a trip-id, Value is a shape-id
 * 2. shapeIdLineStringLookup:
 *    Key is the shape-id of a route, and the value is a LineString of the entire route
 *
 * These two lookup tables frovide enough information to generate a LineString for a
 * trip thats clipped between the entry and exit stops. 
 *
 * @param {string} unzippedGtfsPath path to unzipped gtfs text files
 * @param {string} outputPath path to directory in which generated file is dumped into
 */
async function generateRouteLineClippingLookupTables(
  unzippedGtfsPath,
  outputPath,
) {

  console.log('Starting build of routeline clipping tables');
  const stopTripShapeLookup = await getRouteTripShapeLookup(unzippedGtfsPath);
  console.log('Built <route-id, trip-id> : <shape-id> table');

  const shapeIdLineStringLookup = await getShapesLookup(unzippedGtfsPath);
  console.log('Built <shape-id> : <LineString> table');
  
  const routlineLookups = {
    stopTripShapeLookup,
    shapeIdLineStringLookup,
  };

  await writeFile(
    resolve(outputPath, 'route-line-lookup.json'),
    JSON.stringify(routlineLookups),
    'utf8',
  );
};

module.exports = {
  generateRouteLineClippingLookupTables,
};
