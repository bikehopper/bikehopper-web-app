const { createReadStream } = require('node:fs');
const { writeFile } = require('node:fs/promises');
const turfConvex = require('@turf/convex').default;
const turfBuffer = require('@turf/buffer');
const turfCenterOfMass = require('@turf/center-of-mass').default;
const bbox = require('@turf/bbox').default;
const { filterRouteIds, filterTripIds, getInterestingStopIds, getInterestingStopsAsGeoJsonPoints } = require('./gtfs-helpers');

(async () => {
  // computes a polygon to define the "transit service area"

  // run this with an unzipped 511 GTFS dump saved in the current directory

  // for non-Bay Area regions, you will want to change the next few lines that
  // filter specific parts of the Bay Area transit data, but the rest of this
  // algorithm should be usable

  // Bay Area: we want to filter out stops only served by ACE and Capitol
  // Corridor JPA since they go far outside the area we have local transit for
  // (e.g. Sacramento, Stockton)
  const FILTERED_AGENCY_IDS = new Set(process.env.FILTERED_AGENCY_IDS.split(','));

  // also let's manually filter the SolTrans B, which stops in Davis and Sacramento
  const MANUALLY_FILTERED_ROUTE_IDS = new Set(process.env.MANUALLY_FILTERED_ROUTE_IDS.split(','));

  const routesReadableStream = createReadStream(`/usr/app/mnts/gtfs/routes.txt`, {encoding: 'utf8'});
  const filteredRouteIds = await filterRouteIds(FILTERED_AGENCY_IDS, MANUALLY_FILTERED_ROUTE_IDS, routesReadableStream);

  const tripsReadableStream = createReadStream(`/usr/app/mnts/gtfs/trips.txt`, {encoding: 'utf8'})
  const filteredTripIds = await filterTripIds(filteredRouteIds, tripsReadableStream);

  // now we do things a little backwards... instead of the set of all filtered
  // stops, we build a set of all interesting stops. that is because if a stop
  // is served both by a filtered agency AND a local transit agency, then we
  // want to include it.
  const stopTimesReadableStream = createReadStream(`/usr/app/mnts/gtfs/stop_times.txt`, {encoding: 'utf8'})
  const interestingStopIds = await getInterestingStopIds(filteredTripIds, stopTimesReadableStream);

  // and now just aggregate all the interesting stop IDs as GeoJSON
  const stopsReadableStream = createReadStream(`/usr/app/mnts/gtfs/stops.txt`, {encoding: 'utf8'});
  const interestingStopsAsGeoJsonPoints = await getInterestingStopsAsGeoJsonPoints(interestingStopIds, stopsReadableStream);

  const interestingStopsCollection = {
    type: 'FeatureCollection',
    features: interestingStopsAsGeoJsonPoints,
  };

  const convexHull = turfConvex(interestingStopsCollection);
  const bufferedHull = turfBuffer(convexHull, 5, {units: 'miles'});
  const centerOfBufferedHull = turfCenterOfMass(bufferedHull);
  const boundingBox = bbox(bufferedHull);

  const writingBBox = writeFile('/usr/app/mnts/output/bounding-box.json', JSON.stringify(boundingBox, null, 2));
  const writingCArea = writeFile('/usr/app/mnts/output/center-area.json', JSON.stringify(centerOfBufferedHull, null, 2));
  const writingBHull = writeFile('/usr/app/mnts/output/buffered-hull.json', JSON.stringify(bufferedHull, null, 2));

  await Promise.all([writingBBox, writingCArea, writingBHull]);

  console.log('Bounding box:', JSON.stringify(boundingBox));
  console.log('Center of Area:', JSON.stringify(centerOfBufferedHull));
  console.log('bufferedHull:', JSON.stringify(bufferedHull));
})();
