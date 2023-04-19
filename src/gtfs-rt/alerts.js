import { DateTime } from 'luxon';
import logger from '../lib/logger.js';

// Merges relevant GTFS service alerts into a GraphHopper response.
// Mutates the routeResult param.
export function mergeAlertsIntoRoutes(alerts, routeResult) {
  if (!routeResult || !routeResult.paths || !alerts) return routeResult;

  for (const path of routeResult.paths) {
    for (const leg of path.legs || []) {
      if (leg.type !== 'pt') continue;
      for (const alert of alerts) {
        if (_doesAlertApplyToLeg(alert, leg)) {
          if (!leg.alerts) leg.alerts = [];
          leg.alerts.push(_serializeAlert(alert));
        }
      }
    }
  }
  return routeResult;
}

function _doesAlertApplyToLeg(alert, leg) {
  // no alerts apply to non-publictransit legs
  if (leg.type !== 'pt') return false;

  // does alert apply to the time of this trip?
  const departTs = typeof leg.departure_time === 'string'
    && DateTime.fromISO(leg.departure_time).toMillis();
  const arriveTs = typeof leg.arrival_time === 'string'
    && DateTime.fromISO(leg.arrival_time).toMillis();
  if (departTs && arriveTs && alert.activePeriod.length > 0) {
    if (!alert.activePeriod.some(timeRange => {
      const rangeStart = 1000 * parseInt(timeRange.start, 10);
      const rangeEnd = 1000 * parseInt(timeRange.end, 10);
      return !(rangeEnd < departTs || rangeStart > arriveTs);
    })) {
      return false;
    }
  }

  // check if any of the alert's informed entities are relevant
  for (const entity of alert.informedEntity) {
    // Note: The strings (stop ID, trip ID, route ID) can be present but empty string.
    // In those cases we want to ignore them. So we test if they are falsy, to cover
    // empty string, undefined, or null.
    //
    // In contrast, the routeType enum uses 0 to mean tram, so we compare that against
    // null/undefined rather than checking for truthiness, to make sure we don't ignore
    // a value of 0.

    // if entity includes stop ID, this leg must pass that stop
    if (entity.stopId && leg.stops.every(stop => stop.stop_id !== entity.stopId))
      continue;

    // if entity includes trip ID, this leg must use that trip
    if (entity.trip?.tripId && leg.trip_id && leg.trip_id !== entity.trip.tripId)
      continue;

    // if entity includes route ID, this leg must use that route.
    if (entity.routeId && leg.route_id !== entity.routeId)
      continue;

    if (entity.agencyId && leg.agency_id !== entity.agencyId)
      continue;

    // Not sure if this is the protobuf library's fault or gtfs-realtime-bindings' fault,
    // but if no routeType is provided in the data, entity.routeType evaluates to 0, rather
    // than null/undefined, despite the fact that route type 0 has a very different meaning
    // (no route type means the alert affects all route types; route type 0 means the
    // alert only affects trams). We have to work around this by using hasOwnProperty.
    if (entity.hasOwnProperty('routeType') && entity.route_type !== entity.routeType)
      continue;

    // TODO: Support filtering out alerts with no trip_id, but a trip descriptor
    // including a start time, and support filtering out alerts with a direction_id.
    // For now those conditions are ignored, which may display irrelevant alerts.
    //
    // Other than that, we've tested every property that might filter out the alert,
    // so this alert DOES appear to be relevant to this leg:
    return true;
  }
}

function _serializeAlert(alert) {
  return {
    entities: alert.informedEntity.map(entity => ({
      stop_id: entity.stopId,
      trip_id: entity.trip?.tripId || null,
      // As noted above, we must check if the routeType property is actually present
      // or else evaluating a missing value will result in 0, which means tram.
      route_type: entity.hasOwnProperty('routeType') ? entity.routeType : null,
      route_id: entity.routeId,
      agency_id: entity.agencyId,
    })),
    time_ranges: alert.activePeriod.map(timeRange => ({
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
  };
}
