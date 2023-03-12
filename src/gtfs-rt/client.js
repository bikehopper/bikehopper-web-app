import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import logger from '../lib/logger.js';

const API_KEY = process.env.GTFS_REALTIME_TOKEN;
const ALERTS_URL = process.env.GTFS_REALTIME_ALERTS_URL;

let _alertsCache;
let _alertsCacheTime;
// We're allowed to make 60 requests per hour, let's be conservative and
// cache for 3min to make it a maximum of 20
const CACHE_LENGTH = 3 * 60 * 1000;

export async function getAlerts() {
  let alerts;
  if (_alertsCache && Date.now() - _alertsCacheTime < CACHE_LENGTH) {
    return _alertsCache;
  }

  if (!API_KEY) {
    logger.warn('no API key defined, cannot fetch alerts');
    return null;
  }

  if (!ALERTS_URL) {
    logger.warn('no GTFS-RT alerts URL defined, cannot fetch alerts');
    return null;
  }

  // Add the API key to the URL.
  // TODO: Figure out how to support API implementations that require it as a request
  // header instead, if that exists. I don't know. This seems to be a non-standard thing
  // that 511.org does, requiring it in the URL.
  const url = new URL(ALERTS_URL);
  const usp = new URLSearchParams(url.search);
  usp.append('api_key', API_KEY);
  url.search = usp;

  // FIXME: This will result in possibly sending additional requests while waiting
  // for the first one.
  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`${response.url}: ${response.status} ${response.statusText}`);
    err.response = response;
    throw err;
  }
  const buf = await response.arrayBuffer();
  const alertFeed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buf)
  );
  alerts = alertFeed.entity.filter(ent => ent.alert).map(ent => ent.alert);

  _alertsCache = alerts;
  _alertsCacheTime = Date.now();
  return alerts;
}
