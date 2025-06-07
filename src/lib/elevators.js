import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH } from '../config.js';
import logger from './logger.js';
import { getParentStationStopId } from './gtfs-db.js';

let _elevatorInfo;

function _getElevatorInfo() {
  if (_elevatorInfo === undefined) {
    try {
      const elevInfoPath = join(
        WEB_APP_GEO_CONFIG_FOLDER_CONTAINER_PATH,
        'elevators.json'
      );
      _elevatorInfo = JSON.parse(readFileSync(elevInfoPath, 'utf8'));
      logger.info('elevator info loaded');
    } catch (e) {
      if (e?.code === 'ENOENT') {
        logger.warn('no elevator info');
        _elevatorInfo = null; // Elevator info not provided
      } else {
        throw e;
      }
    }
  }
  return _elevatorInfo;
}

export function mergeElevatorInfoIntoRoutes(routeResult) {
  const elevators = _getElevatorInfo();
  if (!routeResult || !routeResult.paths || !_elevatorInfo) return routeResult;

  for (const path of routeResult.paths) {
    for (const leg of path.legs || []) {
      if (leg.type !== 'pt') continue;

      const firstStop = leg.stops[0];
      const lastStop = leg.stops[leg.stops.length - 1];

      const firstStationStopId = getParentStationStopId(firstStop.stop_id);
      const lastStationStopId = getParentStationStopId(lastStop.stop_id);

      if (Object.hasOwnProperty.call(_elevatorInfo, firstStationStopId)) {
        firstStop.elevators = _elevatorInfo[firstStationStopId];
      }

      if (Object.hasOwnProperty.call(_elevatorInfo, lastStationStopId)) {
        lastStop.elevators = _elevatorInfo[lastStationStopId];
      }
    }
  }
  return routeResult;
}

