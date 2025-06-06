import { join } from 'node:path';
import { getStops, openDb } from 'gtfs';

import { WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH } from '../config.js';

let _db;

export function ensureGtfsDb() {
  if (_db === undefined) {
    _db = openDb({
      sqlitePath: join(WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH, 'gtfs.db'),
    });
  }
  return _db;
}

// Get the stop's parent station ID, if it has one; if not, the input stop ID is
// returned.
export function getParentStationStopId(stopId) {
  ensureGtfsDb();
  let stopInfo = getStops({
    stop_id: stopId,
  }, ['parent_station'])[0];

  if (!stopInfo || stopInfo.parent_station == null) return stopId;
  return stopInfo.parent_station;
}
