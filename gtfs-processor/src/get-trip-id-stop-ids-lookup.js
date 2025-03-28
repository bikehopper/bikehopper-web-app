const { createReadStream } = require('node:fs');
const { resolve } = require("path");
const { parse } = require('csv-parse');


/**
 * Loops over `stop_times.txt` and generates a lookup table, where the key is a trip-id,
 * and the value is an Array of stop-ids on that trip.
 * 
 * @param {*} unzippedGtfsPath 
 * @returns {Object} {
 *    tripIdStopIdsLookup: <trip-id>: <stop-id>[],
 *    stopIdTripIdsLookup: Map<<stop-id>, Set<trip-id>>
 * }
 */
async function getStopsForTripLookup(unzippedGtfsPath){
  const stopTimesStream = createReadStream(resolve(unzippedGtfsPath, 'stop_times.txt'), {encoding: 'utf8'});
  const parser = stopTimesStream.pipe(parse({columns: true}));
  const tripIdStopIdsLookup = {};
  // Don't need to serialize the <stop-id> : <trip-ids>[] lookup, so use a Map
  const stopIdTripIdsLookup = new Map();
  for await (const stopTime of parser) {
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

module.exports = {
  getStopsForTripLookup,
};
