import getRouteTripShapeLookup from './get-route-id-trip-id-shape-id-lookup.js';
import getShapesLookup from './get-shapes-lookup.js';
import getStopsForTripLookup from './get-trip-id-stop-ids-lookup.js';

/**
 * Computes 3 lookup tables:
 * 1. routeTripShapeLookup: 
 *    This is a two-level dictionary
 *    Level1 :
 *    Key is a stop-id, Value is the 2nd Level dictionary
 *       Level 2:
 *       Key is a trip-id, Value is a shape-id
 * 2. shapeIdLineStringLookup:
 *    Key is the shape-id of a route, and the value is a LineString of the entire route
 * 3. tripIdStopIdsLookup:
 *    Key is a trip-id, and value is an array of stop-ids for that trip
 *
 * routeTripShapeLookup and shapeIdLineStringLookup provide enough information to generate a LineString for a
 * trip thats clipped between the entry and exit stops. 
 *
 * @return {Object} {
 *    routeTripShapeLookup: {<route-id, trip-id> : <shape-id>}, 
 *    shapeIdLineStringLookup: {<shape-id> : <LineString>},
 *    tripIdStopIdsLookup: {<trip-id>: <stop-id[]>},
 *    tripRouteLookup: Map<<trip-id> : Set<route-id>>,
 *    stopIdTripIdsLookup: Map<<stop-id> : Set<<trip-id>>,
 * }
 */
export default async function generateRouteLineClippingLookupTables() {
  console.log('Starting build of routeline clipping tables');
  const {routeTripShapeLookup, tripRouteLookup} = await getRouteTripShapeLookup();
  console.log('Built <route-id, trip-id> : <shape-id> table');

  const shapeIdLineStringLookup = await getShapesLookup();
  console.log('Built <shape-id> : <LineString> table');

  const { tripIdStopIdsLookup, stopIdTripIdsLookup } = await getStopsForTripLookup();
  console.log('Built <trip-id> : <stop-id[]> table');

  return {
    routeTripShapeLookup,
    shapeIdLineStringLookup,
    tripIdStopIdsLookup,
    tripRouteLookup,
    stopIdTripIdsLookup,
  };
};
