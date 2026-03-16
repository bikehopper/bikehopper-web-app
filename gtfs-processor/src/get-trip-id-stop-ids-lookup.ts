import { getStoptimes } from 'gtfs';
import type { RouteLinestringLookup } from '../../src/lib/types.js';

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
  const tempTripIdStopIdsLookup: Map<string, Set<string>> = new Map();
  const stopIdTripIdsLookup: Map<string, Set<string>> = new Map();
  for (const stopTime of getStoptimes({}, ['stop_id', 'trip_id'])) {
    const stopId = stopTime['stop_id'];
    const tripId = stopTime['trip_id'];
    if (tripId && stopId) {
      const stops = tempTripIdStopIdsLookup.get(tripId);
      // Use a set to de-dup stop-ids
      if (stops) {
        stops.add(stopId)
      } else {
        tempTripIdStopIdsLookup.set(tripId, new Set([stopId]));
      }
      
      const trips = stopIdTripIdsLookup.get(stopId);
      if (trips) {
        trips.add(tripId);
      } else {
        stopIdTripIdsLookup.set(stopId, new Set([tripId]));
      }
    }
  }
  
  const tripIdStopIdsLookup: RouteLinestringLookup['tripIdStopIdsLookup'] = {};
  // Convert all the Set(s) to Array(s) so we have JSON in lookupTable
  for (const [tripId, stopsSet] of tempTripIdStopIdsLookup.entries()) {
    tripIdStopIdsLookup[tripId] = Array.from(stopsSet);
  }

  return { tripIdStopIdsLookup, stopIdTripIdsLookup };
}
