import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import logger from '../lib/logger.js';
import {
  GTFS_REALTIME_ALERTS_URL,
} from '../consts.js'
import {
  ALERTS_CACHE_TIME_MSEC,
} from '../config.js';

export type GtfsRealtimeAlert = GtfsRealtimeBindings.transit_realtime.IAlert;

let _alertsCache: GtfsRealtimeAlert[] | null;
let _alertsCacheTime = 0;;
let _alertsPromise: Promise<GtfsRealtimeAlert[]> | null;

export async function getAlerts() {
  if (_alertsCache && Date.now() - _alertsCacheTime < ALERTS_CACHE_TIME_MSEC) {
    return _alertsCache;
  }

  if (!GTFS_REALTIME_ALERTS_URL) {
    logger.warn('no GTFS-RT alerts URL defined, cannot fetch alerts');
    return null;
  }

  // If there's already a fetch in progress, we'll wait for that one.
  // But if not, let's initiate one.
  if (!_alertsPromise)
    _alertsPromise = _getAlertsNoCache();

  try {
    const alerts = await _alertsPromise;
    _alertsCache = alerts;
    _alertsCacheTime = Date.now();
    _alertsPromise = null;
    return alerts;
  } catch (err) {
    _alertsPromise = null;
    throw err;
  }
}

async function _getAlertsNoCache(): Promise<GtfsRealtimeAlert[]> {
  const url = new URL(GTFS_REALTIME_ALERTS_URL);
  const response = await fetch(url);

  if (!response.ok) {
    const err = new Error(`${response.url}: ${response.status} ${response.statusText}`);
    (err as any).response = response;
    logger.error(err);
    throw err;
  }
  const buf = await response.arrayBuffer();
  const alertFeed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buf)
  );

  const alerts: GtfsRealtimeAlert[] = [];
  for (const {alert} of alertFeed.entity) {
    if (alert != null) {
      alerts.push(alert);
    }
  }

  return alerts;
}
