import fs from 'fs';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { isEmpty } from 'ramda';
import { URL } from 'node:url';

// Load .env files in a similar way to the bikehopper-ui frontend
// .env.development.local, .env.development, .env, etc
//
// We should probably only use this for development and rely on Docker
// supplying the env vars in production

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error(
    'The NODE_ENV environment variable is required but was not specified.'
  );
}

const dotenvPath = '.env';

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${dotenvPath}.${NODE_ENV}.local`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `${dotenvPath}.local`,
  `${dotenvPath}.${NODE_ENV}`,
  dotenvPath,
].filter(Boolean);

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
for (const dotenvFile of dotenvFiles) {
  if (fs.existsSync(dotenvFile)) {
    dotenvExpand.expand(dotenv.config({path: dotenvFile}));
  }
}

export const PORT = Number(process.env.PORT);
export const GRAPHHOPPER_SERVICE_NAME = process.env.GRAPHHOPPER_SERVICE_NAME;
export const NAMESPACE = process.env.NAMESPACE;
export const HOSTNAME = process.env.HOSTNAME;
export const PHOTON_SERVICE_NAME = process.env.PHOTON_SERVICE_NAME;
export const NOMINATIM_SERVICE_NAME = process.env.NOMINATIM_SERVICE_NAME;
export const GEO_CONFIG_FOLDER_PATH = 'config/geoconfigs';
export const CACHE_CONN_STRING = isEmpty(process.env.CACHE_CONN_STRING) ? undefined : process.env.CACHE_CONN_STRING;

export const GTFS_REALTIME_TOKEN = isEmpty(process.env.GTFS_REALTIME_TOKEN) ? null : process.env.GTFS_REALTIME_TOKEN;
export const GTFS_REALTIME_VEHICLE_POSITION_TOKEN = isEmpty(process.env.GTFS_REALTIME_VEHICLE_POSITION_TOKEN) ? null : process.env.GTFS_REALTIME_VEHICLE_POSITION_TOKEN;
export const GTFS_REALTIME_TRIP_UPDATES_TOKEN = isEmpty(process.env.GTFS_REALTIME_TRIP_UPDATES_TOKEN) ? null : process.env.GTFS_REALTIME_TRIP_UPDATES_TOKEN;
export const GTFS_REALTIME_SERVICE_ALERTS_TOKEN = isEmpty(process.env.GTFS_REALTIME_SERVICE_ALERTS_TOKEN) ? null : process.env.GTFS_REALTIME_SERVICE_ALERTS_TOKEN;

const regionConfig = JSON.parse(fs.readFileSync('data/region-config.json', 'utf8'));

export const REGION_CONFIG = regionConfig;

export const GTFS_REALTIME_ALERTS_URL = regionConfig.gtfsRtUrls?.alerts;
export const GTFS_REALTIME_VEHICLE_POSITIONS_URL =
  regionConfig.gtfsRtUrls?.vehiclePositions;
export const GTFS_REALTIME_TRIP_UPDATES_URL = regionConfig.gtfsRtUrls?.tripUpdates;

// 511.org allows us 60 requests per hour, let's be conservative and
// cache for 3min to make it a maximum of 20.
const DEFAULT_ALERTS_CACHE_TIME_MSEC = 3 * 60 * 1000;
export const ALERTS_CACHE_TIME_MSEC = (
  process.env.ALERTS_CACHE_TIME_MSEC || DEFAULT_ALERTS_CACHE_TIME_MSEC
);

export const MAPBOX_ACCESS_TOKEN = isEmpty(process.env.MAPBOX_ACCESS_TOKEN) ? null : process.env.MAPBOX_ACCESS_TOKEN;
export const MAPBOX_STYLE_URL = isEmpty(process.env.MAPBOX_STYLE_URL) ? null : process.env.MAPBOX_STYLE_URL;

export const FILTERED_AGENCY_IDS = process.env.FILTERED_AGENCY_IDS || '';
export const MANUALLY_FILTERED_ROUTE_IDS = process.env.MANUALLY_FILTERED_ROUTE_IDS || '';
export const SKIP_RECORDS_WITH_ERROR = Boolean(process.env.SKIP_RECORDS_WITH_ERROR);
