const { createReadStream } = require('node:fs');
const { writeFile } = require('node:fs/promises');
const turfConvex = require('@turf/convex').default;
const turfBuffer = require('@turf/buffer').default;
const { resolve } = require("path");
const { filterRouteIds, filterTripIds, getInterestingStopIds, getInterestingStopsAsGeoJsonPoints } = require('./gtfs-helpers');

/**
 * Computes a polygon to define the "transit service area". The
 * purpose for this is, if your instance supports streets routing over a wider
 * geographical area than you have local transit information for, to warn your
 * user if local transit options relevant to their journey might be missing.
 *
 * The approach is to compute a buffered hull around all the transit stops,
 * excluding some stops that are filtered out by route ID or agency ID.
 * 
 * @param {string} unzippedGtfsPath Path to directory containing unzipped gtfs text files
 * @param {string} filteredAgencyIdsString comma separated sting of agency ids
 * @param {string} manuallyFilteredRouteIdsString  comma separated string of route ids
 * @param {string} boundsOutpoutPath Path to directory to output the generated data into
 */
async function generateLocalTransitBounds(
  unzippedGtfsPath,
  filteredAgencyIdsString,
  manuallyFilteredRouteIdsString,
  boundsOutpoutPath,
) {
  /*
  * When computing the transit service area, we want to only include stops
  * served by *local* transit, and not by intra-city services. For example,
  * the flagship BikeHopper instance, at the time of writing, supports
  * streets routing for all of Northern California, but has GTFS data only
  * for the SF Bay Area, except that we do have GTFS data for the Amtrak
  * Capitol Corridor route, which would cause this script to include
  * Sacramento, if we did not filter Capitol Corridor. Filtering out transit
  * stops both by agency ID and by route ID is supported.
  */
  const filteredAgencyIds = new Set(filteredAgencyIdsString.split(','));
  const manuallyFilteredRouteIds = new Set(manuallyFilteredRouteIdsString.split(','));

  const routesReadableStream = createReadStream(resolve(unzippedGtfsPath, `routes.txt`), {encoding: 'utf8'});
  const filteredRouteIds = await filterRouteIds(filteredAgencyIds, manuallyFilteredRouteIds, routesReadableStream);

  const tripsReadableStream = createReadStream(resolve(unzippedGtfsPath, `trips.txt`), {encoding: 'utf8'})
  const filteredTripIds = await filterTripIds(filteredRouteIds, tripsReadableStream);

  // now we do things a little backwards... instead of the set of all filtered
  // stops, we build a set of all interesting stops. that is because if a stop
  // is served both by a filtered agency AND a local transit agency, then we
  // want to include it.
  const stopTimesReadableStream = createReadStream(resolve(unzippedGtfsPath, `stop_times.txt`), {encoding: 'utf8'})
  const interestingStopIds = await getInterestingStopIds(filteredTripIds, stopTimesReadableStream);

  // and now just aggregate all the interesting stop IDs as GeoJSON
  const stopsReadableStream = createReadStream(resolve(unzippedGtfsPath, `stops.txt`), {encoding: 'utf8'});
  const interestingStopsAsGeoJsonPoints = await getInterestingStopsAsGeoJsonPoints(interestingStopIds, stopsReadableStream);

  const interestingStopsCollection = {
    type: 'FeatureCollection',
    features: interestingStopsAsGeoJsonPoints,
  };

  const convexHull = turfConvex(interestingStopsCollection);
  const bufferedHull = turfBuffer(convexHull, 5, {units: 'miles'});

  await writeFile(
    resolve(boundsOutpoutPath, 'transit-service-area.json'),
    JSON.stringify(bufferedHull, null, 2),
    'utf8',
  );
  
  routesReadableStream.close();
  tripsReadableStream.close();
  stopTimesReadableStream.close();
  stopsReadableStream.close();
}

module.exports = {
  generateLocalTransitBounds,
};
