import { writeFile } from 'node:fs/promises';
import turfConvex from '@turf/convex';
import turfBuffer from '@turf/buffer';
import { resolve } from 'node:path';

import { getAgencies, getRoutes, getStops } from 'gtfs';


/**
 * Computes a polygon to define the "transit service area". The
 * purpose for this is, if your instance supports streets routing over a wider
 * geographical area than you have local transit information for, to warn your
 * user if local transit options relevant to their journey might be missing.
 *
 * The approach is to compute a buffered hull around all the transit stops,
 * excluding some stops that are filtered out by route ID or agency ID.
 * 
 * @param {string} filteredAgencyIdsString comma separated sting of agency ids
 * @param {string} manuallyFilteredRouteIdsString  comma separated string of route ids
 * @param {string} boundsOutputPath Path to directory to output the generated data into
 */
export default async function generateLocalTransitBounds(
  filteredAgencyIds,
  manuallyFilteredRouteIds,
  boundsOutputPath,
) {
  /*
  * When computing the transit service area, we want to only include stops
  * served by *local* transit, and not by intra-city services. For example,
  * the flagship BikeHopper instance, at the time of writing, supports
  * streets routing for all of Northern California, but has GTFS data only
  * for the SF Bay Area, except that we do have GTFS data for the Amtrak
  * Capitol Corridor route, which would cause this script to include
  * Sacramento, if we did not filter Capitol Corridor. Filtering out transit
  * stops both by agency ID and by route ID is supported.
  */
  const allAgencyIds = new Set(
    getAgencies({}, ['agency_id'])
      .map(agency => agency.agency_id)
  );
  const interestingAgencyIds = allAgencyIds.difference(new Set(filteredAgencyIds));

  const allRouteIdsOfInterestingAgencies = new Set(
    getRoutes(
      { agency_id: Array.from(interestingAgencyIds) },
      ['route_id'],
    ).map(route => route.route_id)
  );
  const interestingRouteIds = allRouteIdsOfInterestingAgencies.difference(
    new Set(manuallyFilteredRouteIds)
  );

  const interestingStops = getStops(
    { route_id: Array.from(interestingRouteIds) },
    ['stop_id', 'stop_lon', 'stop_lat'],
  );

  const interestingStopsAsGeoJsonPoints = interestingStops.map(stop => ({
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [stop.stop_lon, stop.stop_lat],
    },
    'properties': {},
  }));

  const interestingStopsCollection = {
    type: 'FeatureCollection',
    features: interestingStopsAsGeoJsonPoints,
  };

  const convexHull = turfConvex(interestingStopsCollection);
  const bufferedHull = turfBuffer(convexHull, 5, {units: 'miles'});

  await writeFile(
    resolve(boundsOutputPath, 'transit-service-area.json'),
    JSON.stringify(bufferedHull, null, 2),
    'utf8',
  );
}
