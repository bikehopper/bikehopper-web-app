import fs from 'fs';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { isEmpty } from 'ramda';
import { URL } from 'node:url';

export const PORT = Number(process.env.PORT);
export const PROTOCOL = process.env.PROTOCOL;
export const GRAPHHOPPER_SERVICE_NAME = process.env.GRAPHHOPPER_SERVICE_NAME;
export const NAMESPACE = process.env.NAMESPACE;
export const HOSTNAME = process.env.HOSTNAME;
export const PHOTON_SERVICE_NAME = process.env.PHOTON_SERVICE_NAME;
export const NOMINATIM_SERVICE_NAME = process.env.NOMINATIM_SERVICE_NAME;
export const FILE_SERVICE_NAME = process.env.FILE_SERVICE_NAME;
export const WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH = isEmpty(process.env.WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH) ? '/mnt/geoconfig' : process.env.WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH;
export const SUPPORTED_REGION = process.env.SUPPORTED_REGION;
export const WEB_APP_AGENCY_NAMES_FILE_CONTAINER_PATH = isEmpty(process.env.WEB_APP_AGENCY_NAMES_FILE_CONTAINER_PATH) ? '/mnt/agencies/names.json' : process.env.WEB_APP_AGENCY_NAMES_FILE_CONTAINER_PATH;
export const WEB_APP_DATA_ACK_FILE_CONTAINER_PATH = isEmpty(process.env.WEB_APP_DATA_ACK_FILE_CONTAINER_PATH) ? '/mnt/acknowledgements/data.json' : process.env.WEB_APP_DATA_ACK_FILE_CONTAINER_PATH;
export const CACHE_CONN_STRING = isEmpty(process.env.CACHE_CONN_STRING) ? undefined : process.env.CACHE_CONN_STRING;

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

export const GTFS_REALTIME_TOKEN = isEmpty(process.env.GTFS_REALTIME_TOKEN) ? null : process.env.GTFS_REALTIME_TOKEN;
export const GTFS_REALTIME_VEHICLE_POSITION_TOKEN = isEmpty(process.env.GTFS_REALTIME_VEHICLE_POSITION_TOKEN) ? null : process.env.GTFS_REALTIME_VEHICLE_POSITION_TOKEN;
export const GTFS_REALTIME_TRIP_UPDATES_TOKEN = isEmpty(process.env.GTFS_REALTIME_TRIP_UPDATES_TOKEN) ? null : process.env.GTFS_REALTIME_TRIP_UPDATES_TOKEN;
export const GTFS_REALTIME_SERVICE_ALERTS_TOKEN = isEmpty(process.env.GTFS_REALTIME_SERVICE_ALERTS_TOKEN) ? null : process.env.GTFS_REALTIME_SERVICE_ALERTS_TOKEN;
export const GTFS_REALTIME_ALERTS_URL = isEmpty(process.env.GTFS_REALTIME_ALERTS_URL) ? null : new URL(process.env.GTFS_REALTIME_ALERTS_URL);
export const GTFS_REALTIME_VEHICLE_POSITIONS_URL = isEmpty(process.env.GTFS_REALTIME_VEHICLE_POSITIONS_URL) ? null : new URL(process.env.GTFS_REALTIME_VEHICLE_POSITIONS_URL);
export const GTFS_REALTIME_TRIP_UPDATES_URL = isEmpty(process.env.GTFS_REALTIME_TRIP_UPDATES_URL) ? null : new URL(process.env.GTFS_REALTIME_TRIP_UPDATES_URL);

// 511.org allows us 60 requests per hour, let's be conservative and
// cache for 3min to make it a maximum of 20.
const DEFAULT_ALERTS_CACHE_TIME_MSEC = 3 * 60 * 1000;
export const ALERTS_CACHE_TIME_MSEC = (
  process.env.ALERTS_CACHE_TIME_MSEC || DEFAULT_ALERTS_CACHE_TIME_MSEC
);
