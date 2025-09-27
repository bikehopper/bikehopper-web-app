import { getStoptimes } from 'gtfs';

/**
 * Loops over `stop_times.txt` and generates a lookup table, where the key is a trip-id,
 * and the value is an Array of stop-ids on that trip.
 *
 * @returns {Object} {
 *    tripIdStopIdsLookup: <trip-id>: <stop-id>[],
 *    stopIdTripIdsLookup: Map<<stop-id>, Set<trip-id>>
 * }
 */
export default async function getStopsForTripLookup() {
  const tripIdStopIdsLookup = {};
  // Don't need to serialize the <stop-id> : <trip-ids>[] lookup, so use a Map
  const stopIdTripIdsLookup = new Map();
  for (const stopTime of getStoptimes({}, ['stop_id', 'trip_id'])) {
    const stopId = stopTime['stop_id'];
    const tripId = stopTime['trip_id'];
    if (tripId && stopId) {
      // Use a set to de-dup stop-ids
      if (tripIdStopIdsLookup[tripId] == null) {
        tripIdStopIdsLookup[tripId] = new Set();
      }
      if (!stopIdTripIdsLookup.has(stopId)) {
        stopIdTripIdsLookup.set(stopId, new Set());
      }

      tripIdStopIdsLookup[tripId].add(stopId);
      stopIdTripIdsLookup.get(stopId).add(tripId);
    }
  }

  // Convert all the Set(s) to Array(s) so we have JSON in lookupTable
  for (const tripId of Object.keys(tripIdStopIdsLookup)) {
    const stopsList = Array.from(tripIdStopIdsLookup[tripId]);
    tripIdStopIdsLookup[tripId] = stopsList;
  }

  return { tripIdStopIdsLookup, stopIdTripIdsLookup };
}
