import express from 'express';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE_URL,
} from '../config.js';
import {
  GEO_CONFIG_FOLDER_PATH,
  REGION_CONFIG,
} from '../consts.js';

const router = express.Router();
let transitServiceAreaCache = null;

router.get('/', async (req, res) => {
  let transitServiceArea = transitServiceAreaCache;
  if (!transitServiceArea) {
    try {
      const fileContents = await readFile(join(
        GEO_CONFIG_FOLDER_PATH,
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

  if (MAPBOX_ACCESS_TOKEN != null) {
    config.mapboxAccessToken = MAPBOX_ACCESS_TOKEN;
  }

  if (MAPBOX_STYLE_URL != null) {
    config.mapboxStyleUrl = MAPBOX_STYLE_URL;
  }

  res.json(config);
});

export default router;
