import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import logger from '../lib/logger.js';
import {
  GTFS_REALTIME_TOKEN,
  GTFS_REALTIME_SERVICE_ALERTS_TOKEN,
  GTFS_REALTIME_ALERTS_URL,
} from '../consts.js'
import {
  ALERTS_CACHE_TIME_MSEC,
} from '../config.js';

let _alertsCache;
let _alertsCacheTime;
let _alertsPromise;

export async function getAlerts() {
  if (_alertsCache && Date.now() - _alertsCacheTime < ALERTS_CACHE_TIME_MSEC) {
    return _alertsCache;
  }

  if (!GTFS_REALTIME_TOKEN && !GTFS_REALTIME_SERVICE_ALERTS_TOKEN) {
    logger.warn('no API key defined, cannot fetch alerts');
    return null;
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

async function _getAlertsNoCache() {
  // Add the API key to the URL.
  // TODO: Figure out how to support API implementations that require it as a request
  // header instead, if that exists. I don't know. This seems to be a non-standard thing
  // that 511.org does, requiring it in the URL.
  const url = new URL(GTFS_REALTIME_ALERTS_URL);
  const usp = new URLSearchParams(url.search);
  usp.append('api_key', GTFS_REALTIME_SERVICE_ALERTS_TOKEN || GTFS_REALTIME_TOKEN);
  usp.delete('format', 'json');
  url.search = usp;

  const response = await fetch(url);

  if (!response.ok) {
    const err = new Error(`${response.url}: ${response.status} ${response.statusText}`);
    err.response = response;
    logger.error(err);
    throw err;
  }
  const buf = await response.arrayBuffer();
  const alertFeed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buf)
  );
  const alerts = alertFeed.entity.filter(ent => ent.alert).map(ent => ent.alert);

  return alerts;
}
