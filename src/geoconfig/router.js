import express from 'express';
import { extname, join, parse } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import {
  REGION_CONFIG,
  WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH,
} from '../config.js';

const router = express.Router();
let geoConfigsCache = null;
let agencyNamesCache = null;
let dataAcknowledgement = null;

async function readGeoConfigs() {
  if (geoConfigsCache) return geoConfigsCache;

  const fileNames = (await readdir(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH)).filter(f => {
    return extname(join(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, f)) === '.json';
  });

  const readingFiles = [];
  for (const fileName of fileNames) {
    readingFiles.push(readFile(join(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, fileName), { encoding: 'utf8' }));
  }

  const fileBuffers = await Promise.all(readingFiles);

  geoConfigsCache = fileNames.reduce((accum, fileName, i) => {
    accum[parse(fileName).name] = JSON.parse(fileBuffers[i]);
    return accum;
  }, {});

  return geoConfigsCache;
}

router.get('/', async (req, res) => {
  let geoConfigs;
  try {
    geoConfigs = await readGeoConfigs();
  } catch (err) {
    console.warn('failed to read geoconfigs', err);
  }

  const config = {...REGION_CONFIG};
  if (geoConfigs && 'transit-service-area' in geoConfigs) {
    config.transitServiceArea = geoConfigs['transit-service-area'];
  }

  res.json(config);
});

export default router;
