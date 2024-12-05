import express from 'express';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  REGION_CONFIG,
  WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH,
} from '../config.js';

const router = express.Router();
let transitServiceAreaCache = null;

router.get('/', async (req, res) => {
  let transitServiceArea = transitServiceAreaCache;
  if (!transitServiceArea) {
    try {
      const fileContents = await readFile(join(
        WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH,
        'transit-service-area.json',
      ), { encoding: 'utf8' });
      transitServiceArea = JSON.parse(fileContents);

      if (process.env.NODE_ENV !== 'development') {
        transitServiceAreaCache = transitServiceArea;
      }
    } catch (err) {
      console.warn('failed to read transit service area', err);
    }
  }

  const config = {...REGION_CONFIG};
  if (transitServiceArea) {
    config.transitServiceArea = transitServiceArea;
  }
  delete config.gtfsRtUrls; // Not used in frontend (can't be, would expose token)

  res.json(config);
});

export default router;
