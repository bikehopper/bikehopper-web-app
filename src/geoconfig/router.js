import express from 'express';
import { extname, join, parse } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import {
  WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH,
  SUPPORTED_REGION,
  WEB_APP_AGENCY_NAMES_FILE_CONTAINER_PATH,
  WEB_APP_DATA_ACK_FILE_CONTAINER_PATH
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
    accum['geoConfig'][parse(fileName).name] = JSON.parse(fileBuffers[i]);
    return accum;
  }, {
    geoConfig: {}
  });

  return geoConfigsCache;
}

async function readAgencyNames() {
  if (agencyNamesCache) return agencyNamesCache;

  const fileBuffer = await readFile(WEB_APP_AGENCY_NAMES_FILE_CONTAINER_PATH, { encoding: 'utf8' });
  
  agencyNamesCache = {
    agencyNames: JSON.parse(fileBuffer)
  };

  return agencyNamesCache;
}

async function readDataAcknowledgement() {
  if (dataAcknowledgement) return dataAcknowledgement;
  const fileBuffer = await readFile(WEB_APP_DATA_ACK_FILE_CONTAINER_PATH, { encoding: 'utf8' });
  
  dataAcknowledgement = {
    dataAcknowledgements: JSON.parse(fileBuffer)
  };

  return dataAcknowledgement;
}

router.get('/', async (req, res) => {
  const configFileResults = await Promise.allSettled([
    readGeoConfigs(),
    readAgencyNames(),
    readDataAcknowledgement()
  ]);

  configFileResults
    .filter(result => result.status === 'rejected')
    .forEach(failedResult => {
      console.warn('failed to read a dynamic config file.', failedResult.reason);
    });

  const responseConfig = configFileResults
    .filter(result => result.status === 'fulfilled')
    .reduce((accum, result) => {
      return {
        ...accum,
        ...result.value
      }
    }, {
      supportedRegion: SUPPORTED_REGION
    });

  res.json(responseConfig);
});

export default router;
