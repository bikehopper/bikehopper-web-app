import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import fs from 'node:fs';

// Load .env files in a similar way to the bikehopper-ui frontend
// .env.development.local, .env.development, .env, etc
//
// We should probably only use this for development and rely on Docker
// supplying the env vars in production

const NODE_ENV = process.env.NODE_ENV || 'development';
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
    dotenvExpand.expand(dotenv.config({path: dotenvFile, quiet: true}));
  }
}

export const PORT = Number(process.env.PORT) || 3001;
export const GRAPHHOPPER_SERVICE_NAME = process.env.GRAPHHOPPER_SERVICE_NAME;
export const PHOTON_SERVICE_NAME = process.env.PHOTON_SERVICE_NAME;
export const NOMINATIM_SERVICE_NAME = process.env.NOMINATIM_SERVICE_NAME;
export const CACHE_CONN_STRING = process.env.CACHE_CONN_STRING || undefined;

const DEFAULT_ALERTS_CACHE_TIME_MSEC = 0.5 * 60 * 1000; // half-minute update interval
export const ALERTS_CACHE_TIME_MSEC = (
  process.env.ALERTS_CACHE_TIME_MSEC || DEFAULT_ALERTS_CACHE_TIME_MSEC
);

export const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || null;
export const MAPBOX_STYLE_URL = process.env.MAPBOX_STYLE_URL || null;

export const FILTERED_AGENCY_IDS = process.env.FILTERED_AGENCY_IDS || '';
export const MANUALLY_FILTERED_ROUTE_IDS = process.env.MANUALLY_FILTERED_ROUTE_IDS || '';
export const SKIP_RECORDS_WITH_ERROR = Boolean(process.env.SKIP_RECORDS_WITH_ERROR);
