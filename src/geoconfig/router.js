import express from 'express';
import { extname, join, parse } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import {
  BIKEHOPPER_WEB_APP_GEO_CONFIG_PATH
} from '../config.js';

const router = express.Router();
let geoConfigsCache = null;

async function readGeoConfigs() {
  if (geoConfigsCache) return geoConfigsCache;

  const fileNames = (await readdir(BIKEHOPPER_WEB_APP_GEO_CONFIG_PATH)).filter(f => {
    return extname(join(BIKEHOPPER_WEB_APP_GEO_CONFIG_PATH, f)) === '.json';
  });

  const readingFiles = [];
  for (const fileName of fileNames) {
    readingFiles.push(readFile(join(BIKEHOPPER_WEB_APP_GEO_CONFIG_PATH, fileName), { encoding: 'utf8' }));
  }

  const fileBuffers = await Promise.all(readingFiles);

  geoConfigsCache = fileNames.reduce((accum, fileName, i) => {
    accum[parse(fileName).name] = JSON.parse(fileBuffers[i]);
    return accum;
  }, {});

  return geoConfigsCache;
}

router.get('/', async (req, res) => {
  const geoConfigs = await readGeoConfigs();
  try {
    res.json(geoConfigs);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
});

export default router;
