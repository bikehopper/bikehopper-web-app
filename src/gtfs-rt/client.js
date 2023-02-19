import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

// FIXME
const API_KEY = 'paste api key here';
const BASE_URL = 'https://api.511.org/transit/servicealerts';
const PARAMS = {
  api_key: API_KEY,
  agency: 'RG',
};

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

  // FIXME: This will result in possibly sending additional requests while waiting
  // for the first one.
  const url = new URL(`${BASE_URL}?${new URLSearchParams(PARAMS)}`);
  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`${response.url}: ${response.status} ${response.statusText}`);
    err.response = response;
    throw error;
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
