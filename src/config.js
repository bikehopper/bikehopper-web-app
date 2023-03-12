import fs from 'fs';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

export const PORT = Number(process.env.PORT);
export const PROTOCOL = process.env.PROTOCOL;
export const GRAPHHOPPER_SERVICE_NAME = process.env.GRAPHHOPPER_SERVICE_NAME;
export const NAMESPACE = process.env.NAMESPACE;
export const HOSTNAME = process.env.HOSTNAME;
export const PHOTON_SERVICE_NAME = process.env.PHOTON_SERVICE_NAME;
export const NOMINATIM_SERVICE_NAME = process.env.NOMINATIM_SERVICE_NAME;
export const FILE_SERVICE_NAME = process.env.FILE_SERVICE_NAME;

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