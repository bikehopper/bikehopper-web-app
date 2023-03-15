import { DateTime } from 'luxon';
import logger from '../lib/logger.js';

// Merges relevant GTFS service alerts into a GraphHopper response.
// Mutates the routeResult param.
export function mergeAlertsIntoRoutes(alerts, routeResult) {
  if (!routeResult || !routeResult.paths || !alerts) return routeResult;

  // Alerts can be agency-wide but only for a specific route type operated by that agency,
  // for example all cable cars operated by SFMTA but not buses or light rail.
  const routeTypesByAgencyId = new Map();
  // I'm assuming route, trip and stop IDs are globally unique, without having to
  // join them with the agency ID.
  const routeIds = new Set();
  const tripIds = new Set();
  const boardAndAlightStopIds = new Set();

  let earliestDeparture;
  let latestArrival;

  for (const path of routeResult.paths) {
    for (const leg of path.legs || []) {
      if (leg.type !== 'pt') continue;

      if (typeof leg.departure_time === 'string') {
        const timestamp = DateTime.fromISO(leg.departure_time).toMillis();
        if (!earliestDeparture || timestamp < earliestDeparture)
          earliestDeparture = timestamp;
      }

      if (typeof leg.arrival_time === 'string') {
        const timestamp = DateTime.fromISO(leg.arrival_time).toMillis();
        if (!latestArrival || timestamp > latestArrival)
          latestArrival = timestamp;
      }

      // add agency ID and route type combo
      if (typeof leg.agency_id === 'string') {
        if (!routeTypesByAgencyId.has(leg.agency_id))
          routeTypesByAgencyId.set(leg.agency_id, new Set());
        routeTypesByAgencyId.get(leg.agency_id).add(leg.route_type);
      }

      if (typeof leg.route_id === 'string')
        routeIds.add(leg.route_id);

      if (typeof leg.trip_id === 'string')
        tripIds.add(leg.trip_id);

      if (Array.isArray(leg.stops) && leg.stops.length > 0) {
        const boardStopId = leg.stops[0]?.stop_id;
        const alightStopId = leg.stops[leg.stops.length - 1]?.stop_id;
        if (typeof boardStopId === 'string')
          boardAndAlightStopIds.add(boardStopId);
        if (typeof alightStopId === 'string')
          boardAndAlightStopIds.add(alightStopId);
      }
    }
  }

  const relevantAlerts = alerts.filter(alert => {
    // filter based on time
    if (earliestDeparture && latestArrival && alert.activePeriod.length > 0) {
      if (!alert.activePeriod.some(timeRange => {
        const rangeStart = 1000 * parseInt(timeRange.start, 10);
        const rangeEnd = 1000 * parseInt(timeRange.end, 10);
        return !(rangeEnd < earliestDeparture || rangeStart > latestArrival);
      })) {
        return false;
      }
    }

    // Filter based on agency/route/trip/stop
    // NOT SUPPORTED IN FILTERING CURRENTLY:
    //   - Alerts with no agency_id (they will always be filtered out)
    //   - Alerts with a trip descriptor with no trip_id but only a start time
    //       (they will always be shown even when not relevant)
    //   - Alerts with a direction_id (they will always be shown even when
    //       the direction is not relevant)
    return alert.informedEntity.some(entity => {
      // Note: The strings (stop ID, trip ID, route ID) can be present but empty string.
      // In those cases we want to ignore them. So we test if they are falsy, to cover
      // empty string, undefined, or null.
      //
      // In contrast, the routeType enum uses 0 to mean tram, so we compare that against
      // null/undefined rather than checking for truthiness, to make sure we don't ignore
      // a value of 0.
      if (entity.stopId && !boardAndAlightStopIds.has(entity.stopId)) return false;
      if (entity.trip?.tripId && !tripIds.has(entity.trip.tripId)) return false;
      if (entity.routeId && !routeIds.has(entity.routeId)) return false;
      const routeTypesForThisAgency = routeTypesByAgencyId.get(entity.agencyId);
      if (!routeTypesForThisAgency) return false;

      // Not sure if this is the protobuf library's fault or gtfs-realtime-bindings' fault,
      // but if no routeType is provided in the data, entity.routeType evaluates to 0, rather
      // than null/undefined, despite the fact that route type 0 has a very different meaning
      // (no route type means the alert affects all route types; route type 0 means the
      // alert only affects trams). We have to work around this by using hasOwnProperty
      if (
        entity.hasOwnProperty('routeType')
        && !routeTypesForThisAgency.has(entity.routeType)
      ) {
        return false;
      }
      return true;
    });
  });

  // Format relevant alerts into plain JSONable objects using snake_case
  routeResult.service_alerts = relevantAlerts.map(alert => ({
    entities: alert.informedEntity.map(entity => ({
      stop_id: entity.stopId,
      trip_id: entity.trip?.tripId || null,
      // As noted above, we must check if the routeType property is actually present
      // or else evaluating a missing value will result in 0, which means tram.
      route_type: entity.hasOwnProperty('routeType') ? entity.routeType : null,
      route_id: entity.routeId,
      agency_id: entity.agencyId,
    })),
    timeRanges: alert.activePeriod.map(timeRange => ({
      start: 1000 * parseInt(timeRange.start, 10),
      end: 1000 * parseInt(timeRange.end, 10),
    })),
    header_text: {
      translation: alert.headerText.translation.map(translation => ({
        language: translation.language,
        text: translation.text,
      })),
    },
    description_text: {
      translation: alert.descriptionText.translation.map(translation => ({
        language: translation.language,
        text: translation.text,
      })),
    },
    cause: alert.cause,
    effect: alert.effect,
    severity_level: alert.severityLevel,
    // There are a few more possible fields we could add support for, like
    // url, tts_header_text, tts_description_text.
  }));

  return routeResult;
}
