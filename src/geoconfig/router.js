import express from 'express';
import { extname, join, parse } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import {
  WEB_APP_GEO_CONFIG_CONTAINER_PATH
} from '../config.js';

const router = express.Router();
let geoConfigsCache = null;

async function readGeoConfigs() {
  if (geoConfigsCache) return geoConfigsCache;

  const fileNames = (await readdir(WEB_APP_GEO_CONFIG_CONTAINER_PATH)).filter(f => {
    return extname(join(WEB_APP_GEO_CONFIG_CONTAINER_PATH, f)) === '.json';
  });

  const readingFiles = [];
  for (const fileName of fileNames) {
    readingFiles.push(readFile(join(WEB_APP_GEO_CONFIG_CONTAINER_PATH, fileName), { encoding: 'utf8' }));
  }

  const fileBuffers = await Promise.all(readingFiles);

  geoConfigsCache = fileNames.reduce((accum, fileName, i) => {
    accum[parse(fileName).name] = JSON.parse(fileBuffers[i]);
    return accum;
  }, {});

  return geoConfigsCache;
}

router.get('/', async (req, res) => {

  try {
    const geoConfigs = await readGeoConfigs();
    res.json(geoConfigs);
  } catch (error) {
    console.error('failed to read geoconfig', error);
    res.sendStatus(500);
  }
  res.end();
});

export default router;
