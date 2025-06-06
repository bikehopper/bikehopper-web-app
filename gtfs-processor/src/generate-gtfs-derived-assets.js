import { mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFile, stat } from 'node:fs/promises';
import { closeDb, importGtfs, openDb } from 'gtfs';

import generateLocalTransitBounds from './generate-local-transit-bounds.js';
import generateRouteLineClippingLookupTables from './generate-route-line-clipping-lookup-tables.js';
import generateRouteTiles from './generate-route-tiles.js';
import processElevatorInfo from './process-elevator-info.js';

/*
 * This script generates several assets from the GTFS zip file.
 * These assets are used in bikehopper-web-app to expose some data from the GTFS files.
 * The assets are:
 *  1. transit-service-area.json: 
 *     A rough GeoJSON polygon describing the area served transit in the GTFS
 *  2. route-line-lookup.json:
 *     Lookup tables that provide easy lookups for locations of transit stops, 
 *     route LineString shapes, and extra information for clipping route LineStrings between two stops.
 *  3. gtfs.db: a SQLite database with all the GTFS feed info.
 *  4. route-tiles and stop-tiles: Map tiles for displaying route and stop
 *     information.
 */

const requiredGTFSFiles = new Set(['routes.txt', 'trips.txt', 'stop_times.txt', 'stops.txt', 'shapes.txt']);
const ENV_FILTERED_AGENCY_IDS = process.env.FILTERED_AGENCY_IDS || '';
const ENV_MANUALLY_FILTERED_ROUTE_IDS = process.env.MANUALLY_FILTERED_ROUTE_IDS || '';

// Initialize temprary folders to hold gtfs files
const gtfsFilePath = resolve(process.env.GTFS_ZIP_PATH);
const elevatorInfoPath = process.env.ELEVATOR_INFO_PATH &&
  resolve(process.env.ELEVATOR_INFO_PATH);
const outputPath = resolve(process.env.OUTPUT_DIR_PATH);
const sqlitePath = resolve(outputPath, 'gtfs.db');

const gtfsImportConfig = {
  agencies: [
    {
      path: gtfsFilePath,
      // Not sure what route_attributes is (not in spec!) but the lib complains
      // about a primary-key uniqueness issue in it with regard to the Bay Area 511
      // GTFS. We do not use it.
      exclude: ['route_attributes'],
    },
  ],
  sqlitePath,
};

// Import the GTFS zip to a DB, but skip if GTFS DB already exists and is
// newer than zip.
const gtfsZipModificationTime = (await stat(gtfsFilePath)).mtimeMs;
let gtfsDbModificationTime;
try {
  gtfsDbModificationTime = (await stat(sqlitePath)).mtimeMs;
} catch(e) {
  // File not found is normal. Rethrow any other errors
  if (e?.code !== 'ENOENT' || e?.syscall !== 'stat') {
    throw e;
  }
}
if (
  gtfsDbModificationTime == null
  || gtfsZipModificationTime >= gtfsDbModificationTime
) {
  console.log('Importing GTFS DB');
  await importGtfs(gtfsImportConfig);
} else {
  console.log('Skipping GTFS DB import: DB already newer than zip');
}

const gtfsDb = openDb(gtfsImportConfig);

// Generate transit-service-area.json
await generateLocalTransitBounds(
  ENV_FILTERED_AGENCY_IDS.split(','),
  ENV_MANUALLY_FILTERED_ROUTE_IDS.split(','),
  outputPath
);

console.log(`Finished writing transit-service-area.json to: ${outputPath}`)

// Generate elevators.json
if (elevatorInfoPath) {
  console.log(`Processing elevator info from ${elevatorInfoPath}`);
  const elevatorInfo = processElevatorInfo(elevatorInfoPath, outputPath);
  const elevOutputPath = resolve(outputPath, 'elevators.json');
  await writeFile(elevOutputPath, JSON.stringify(elevatorInfo), 'utf8');
  console.log(`Finished writing elevator info to: ${elevOutputPath}`)
} else {
  console.log('No elevator info defined; skipping');
}

// Generate route-line-lookup.json
const routelineLookups = await generateRouteLineClippingLookupTables(gtfsDb);
const { routeTripShapeLookup, shapeIdLineStringLookup, tripIdStopIdsLookup } = routelineLookups;

// Write the JSON dictionaries to disk so we can use it in bikehopper-web-app at request time for fast lookups
await writeFile(
  resolve(outputPath, 'route-line-lookup.json'),
  JSON.stringify({
    routeTripShapeLookup,
    shapeIdLineStringLookup,
    tripIdStopIdsLookup,
  }),
  'utf8',
);

console.log(`Finished writing route-line-lookup.json to: ${outputPath}`)

await generateRouteTiles(
  routelineLookups,
  outputPath,
);

console.log(`Finished writing /route-tiles to: ${outputPath}`)
closeDb(gtfsDb);
