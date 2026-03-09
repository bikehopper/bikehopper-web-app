import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { GEO_CONFIG_FOLDER_PATH } from '../consts.js';
import logger from './logger.js';
import { getParentStationStopId } from './gtfs-db.js';
import { ElevatorsJsonParser, type ElevatorsJson } from './elevator-types.js';
import type { RouteResponse } from '../graphhopper/types.js';

let _elevatorInfo: ElevatorsJson | null;

function _getElevatorInfo() {
  if (_elevatorInfo === undefined) {
    try {
      const elevInfoPath = join(
        GEO_CONFIG_FOLDER_PATH,
        'elevators.json'
      );
      _elevatorInfo = ElevatorsJsonParser.parse(JSON.parse(readFileSync(elevInfoPath, 'utf8')));
      logger.info('elevator info loaded');
    } catch (e) {
      if ((e as any)?.code === 'ENOENT') {
        logger.warn('no elevator info');
        _elevatorInfo = null; // Elevator info not provided
      } else {
        throw e;
      }
    }
  }
  return _elevatorInfo;
}

export function mergeElevatorInfoIntoRoutes(routeResult: RouteResponse) {
  _getElevatorInfo();
  if (!routeResult || !routeResult.paths || !_elevatorInfo) return routeResult;

  for (const path of routeResult.paths) {
    for (const leg of path.legs || []) {
      if (leg.type !== 'pt') continue;

      const firstStop = leg.stops[0];
      const lastStop = leg.stops[leg.stops.length - 1];

      if (firstStop == null) continue;
      if (lastStop == null) continue;

      const firstStationStopId = getParentStationStopId(firstStop.stop_id);
      const lastStationStopId = getParentStationStopId(lastStop.stop_id);

      if (Object.hasOwnProperty.call(_elevatorInfo, firstStationStopId)) {
        firstStop.elevators = _elevatorInfo[firstStationStopId] || [];
      }

      if (Object.hasOwnProperty.call(_elevatorInfo, lastStationStopId)) {
        lastStop.elevators = _elevatorInfo[lastStationStopId] || [];
      }
    }
  }
  return routeResult;
}

