const { createReadStream, createWriteStream } = require('node:fs');
const { writeFile, mkdtemp, rm } = require('node:fs/promises');
const turfConvex = require('@turf/convex').default;
const turfBuffer = require('@turf/buffer').default;
const turfCenterOfMass = require('@turf/center-of-mass').default;
const bbox = require('@turf/bbox').default;
const unzipper = require("unzipper");
const { resolve, join, basename} = require("path");
const { tmpdir } = require('node:os');
const { filterRouteIds, filterTripIds, getInterestingStopIds, getInterestingStopsAsGeoJsonPoints } = require('./gtfs-helpers');

const requiredGTFSFiles = new Set(['routes.txt', 'trips.txt', 'stop_times.txt', 'stops.txt']);
const ENV_FILTERED_AGENCY_IDS = process.env.FILTERED_AGENCY_IDS || '';
const ENV_MANUALLY_FILTERED_ROUTE_IDS = process.env.MANUALLY_FILTERED_ROUTE_IDS || '';

async function unzip(src, dest) {
  const zip = createReadStream(src).pipe(unzipper.Parse({forceStream: true}));
  for await (const entry of zip) {
    const fileName = basename(entry.path);
    if (requiredGTFSFiles.has(fileName)) {
      entry.pipe(createWriteStream(join(dest, fileName)));
    } else {
      entry.autodrain();
    }
  }
}

(async () => {
  // computes a polygon to define the "transit service area"

  // run this with an unzipped 511 GTFS dump saved in the current directory

  // for non-Bay Area regions, you will want to change the next few lines that
  // filter specific parts of the Bay Area transit data, but the rest of this
  // algorithm should be usable

  // Initialize temprary folders to hold gtfs files
  const gtfsFilePath = resolve(process.env.GTFS_ZIP_PATH);
  const gtfsOutputPath =  await mkdtemp(join(tmpdir(), 'gtfs-'));

  // decompress GTFS zip
  await unzip(gtfsFilePath, gtfsOutputPath);

  // Bay Area: we want to filter out stops only served by ACE and Capitol
  // Corridor JPA since they go far outside the area we have local transit for
  // (e.g. Sacramento, Stockton)
  const FILTERED_AGENCY_IDS = new Set(ENV_FILTERED_AGENCY_IDS.split(','));

  // also let's manually filter the SolTrans B, which stops in Davis and Sacramento
  const MANUALLY_FILTERED_ROUTE_IDS = new Set(ENV_MANUALLY_FILTERED_ROUTE_IDS.split(','));

  const routesReadableStream = createReadStream(resolve(gtfsOutputPath, `routes.txt`), {encoding: 'utf8'});
  const filteredRouteIds = await filterRouteIds(FILTERED_AGENCY_IDS, MANUALLY_FILTERED_ROUTE_IDS, routesReadableStream);

  const tripsReadableStream = createReadStream(resolve(gtfsOutputPath, `trips.txt`), {encoding: 'utf8'})
  const filteredTripIds = await filterTripIds(filteredRouteIds, tripsReadableStream);

  // now we do things a little backwards... instead of the set of all filtered
  // stops, we build a set of all interesting stops. that is because if a stop
  // is served both by a filtered agency AND a local transit agency, then we
  // want to include it.
  const stopTimesReadableStream = createReadStream(resolve(gtfsOutputPath, `stop_times.txt`), {encoding: 'utf8'})
  const interestingStopIds = await getInterestingStopIds(filteredTripIds, stopTimesReadableStream);

  // and now just aggregate all the interesting stop IDs as GeoJSON
  const stopsReadableStream = createReadStream(resolve(gtfsOutputPath, `stops.txt`), {encoding: 'utf8'});
  const interestingStopsAsGeoJsonPoints = await getInterestingStopsAsGeoJsonPoints(interestingStopIds, stopsReadableStream);

  const interestingStopsCollection = {
    type: 'FeatureCollection',
    features: interestingStopsAsGeoJsonPoints,
  };

  const convexHull = turfConvex(interestingStopsCollection);
  const bufferedHull = turfBuffer(convexHull, 5, {units: 'miles'});
  const centerOfBufferedHull = turfCenterOfMass(bufferedHull);
  const boundingBox = bbox(bufferedHull);

  const outputPath = resolve(process.env.OUTPUT_DIR_PATH);

  const writingBBox = writeFile(resolve(outputPath, 'bounding-box.json'), JSON.stringify(boundingBox, null, 2), 'utf8');
  const writingCArea = writeFile(resolve(outputPath, 'center-area.json'), JSON.stringify(centerOfBufferedHull, null, 2), 'utf8');
  const writingBHull = writeFile(resolve(outputPath, 'buffered-hull.json'), JSON.stringify(bufferedHull, null, 2), 'utf8');

  await Promise.all([writingBBox, writingCArea, writingBHull]);

  console.log(`Finsihed writing output files to: ${outputPath}`);
})();
