import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { getAgencies, getRoutes, getStops } from 'gtfs';
import groupBy from 'lodash/groupBy.js';
import omit from 'lodash/omit.js';

export default function processElevatorInfo(elevatorInfoPath, outputPath) {
  const elevators = parse(readFileSync(elevatorInfoPath, 'utf8'), { columns: true });

  // Does each elevator row have a valid agency string?
  if (!elevators.every(elev =>
    ({}).hasOwnProperty.call(elev, 'agency') && typeof elev.agency === 'string'
      && elev.agency !== '' && !(elev.agency in Object.prototype)
  )) {
    throw new Error('one or more elevator rows missing valid "agency" field');
  }

  const elevatorsByAgency = groupBy(elevators, elev => elev.agency);

  // This is the processed data that will ultimately be returned
  const elevatorsForStopId = {};

  for (const agencyName of Object.keys(elevatorsByAgency)) {
    const agencyId = getAgencies(
      { agency_name: agencyName },
      ['agency_id'],
    )[0]?.agency_id;
    if (!agencyId) {
      console.log(`skipping unknown agency: ${agencyName}`);
      continue;
    }

    const agencyRouteIds = getRoutes({ agency_id: agencyId }, ['route_id'])
      .map(route => route.route_id);

    const agencyServedStops = new Map(
      getStops(
        {
          route_id: agencyRouteIds,
        },
        ['stop_id', 'stop_name', 'parent_station'],
      ).map(stop => (
        stop.parent_station ?
          getStops(
            { stop_id: stop.parent_station },
            ['stop_id', 'stop_name'],
          )[0] : stop
      )).map(stop => [stop.stop_id, stop])
    );
    const agencyStopNormalizedNames = new Map();
    const ambiguousPrefixes = new Set();
    for (const stop of agencyServedStops.values()) {
      const stopName = stop.stop_name;
      const normalizedNames = [normalizeStopName(stopName)];
      if (stopName.indexOf('/') !== -1) {
        // Also store the part before the slash, if unambiguous
        // E.g. both "Civic Center / UN Plaza" and "Civic Center"
        const normalizedNameBeforeSlash = normalizeStopName(
          stopName.replace(/\s*\/.*$/, '')
        );
        // Is it ambiguous? Only store this prefix if not ambiguous.
        if (agencyStopNormalizedNames.has(normalizedNameBeforeSlash)) {
          ambiguousPrefixes.add(normalizedNameBeforeSlash);
          agencyStopNormalizedNames.delete(normalizedNameBeforeSlash);
        } else if (!ambiguousPrefixes.has(normalizedNameBeforeSlash)) {
          normalizedNames.push(normalizedNameBeforeSlash);
        }
      }
      for (const name of normalizedNames) {
        agencyStopNormalizedNames.set(name, stop.stop_id);
      }
    }

    const elevatorsByStation = new Map(
      Object.entries(
        groupBy(
          elevatorsByAgency[agencyName],
          elev => elev.station,
        )
      )
    );
    const elevatorCsvStationNameToStopId = new Map();

    // Map any exact matches
    const needsFuzzyMatch = [];
    for (const stationName of elevatorsByStation.keys()) {
      const normalizedStationName = normalizeStopName(stationName);
      let stopId;
      if ((stopId = agencyStopNormalizedNames.get(normalizedStationName)) != null) {
        elevatorCsvStationNameToStopId.set(stationName, stopId);

        // Assume CSV is internally consistent. Therefore, mark this stop as
        // matched so it won't be fuzzy-matched by another string later.
        agencyServedStops.set(stopId, {
          ...agencyServedStops.get(stopId),
          matched: true,
        });
      } else {
        needsFuzzyMatch.push(stationName);
      }
    }

    // Fuzzy match the rest. The name might be given differently.
    for (const stationName of needsFuzzyMatch) {
      const normalizedStationName = normalizeStopName(stationName);
      let bestMatchName, bestMatchStop, bestMatchDistance = Infinity;
      for (const [normalizedStopName, stopId] of agencyStopNormalizedNames.entries()) {
        const stop = agencyServedStops.get(stopId);
        if (stop.matched) continue;
        const dist = levenshtein(normalizedStationName, normalizedStopName);
        if (dist < bestMatchDistance) {
          bestMatchName = normalizedStopName;
          bestMatchStop = stop;
          bestMatchDistance = dist;
        }
      }
      if (!bestMatchStop) {
        console.log(`Skipping elevator info for ${stationName}: no match found`);
        continue;
      }
      const stopId = bestMatchStop.stop_id;
      elevatorCsvStationNameToStopId.set(stationName, stopId);

      console.log(`Assuming '${normalizedStationName}' means '${bestMatchName}': ` +
        `levenshtein distance ${bestMatchDistance}`);

      // Assume CSV is internally consistent. Therefore, mark this stop as
      // matched so it won't be fuzzy-matched again by another input later.
      agencyServedStops.set(stopId, {
        ...bestMatchStop,
        matched: true,
      });
    }

    for (const [elevatorCsvStationName, stopId] of
      elevatorCsvStationNameToStopId.entries()
    ) {
      elevatorsForStopId[stopId] = elevatorsByStation.get(elevatorCsvStationName);
    }
  }
  return elevatorsForStopId;
}

function normalizeStopName(stopName) {
  // Convert a stop name to a form that's more likely to match
  // e.g. 16th Street / Mission -> 16th st mission
  return stopName
    .toLowerCase()
    .replace(/[\s./,\-:]+/g, ' ')
    .replace(/\bst(reet)?\b/g, 'st')
    .replace(/\bav(e|enue)?\b/g, 'av');
}

function levenshtein(s1, s2) {
  // Computing Levenshtein distance to change string s1 into s2.
  // First, compute a row representing the distance from a 0-length prefix of
  // s1 to an M-length prefix of s2 for 0 <= M <= s2.length.
  let row = Array(s2.length + 1);
  for (let m = 0; m <= s2.length; m++) {
    row[m] = m;
  }
  // Now, for each N, 0 < N < s1.length, compute the distance from an N-length
  // prefix of s1 to an M-length prefix of s2. This is done one row at a time
  // referencing the previous row.
  let prevRow = Array(s2.length + 1);
  for (let n = 1; n <= s1.length; n++) {
    let _tmp = prevRow;
    prevRow = row;
    row = _tmp; // Reuse to avoid allocations (no values are reused).

    // To go from N-length prefix of s1 to empty string requires N deletes:
    row[0] = n;
    for (let m = 1; m <= s2.length; m++) {
      // Computing distance from N-length prefix of s1 to M-length prefix of s2.
      // 1. Delete last character from N-length prefix of s1.
      //    Then the distance is 1 plus the distance from (N-1)-length prefix
      //    of s1 to M-length prefix of s2.
      const deleteCost = 1 + prevRow[m];
      // 2. Insert Mth (1-based) character of s2.
      //    Then the distance is 1 plus the distance from N-length prefix of s1
      //    to (M-1)-length prefix of s2.
      const insertCost = 1 + row[m - 1];
      // 3. Replace Nth (1-based) character of s1 with Mth (1-based) of s2.
      //    If they are already the same, distance is same as (N-1)-length prefix
      //    of s1 to (M-1)-length prefix of s2; otherwise it's that plus one.
      const replaceCost = (s1[n - 1] === s2[m - 1] ? 0 : 1) + prevRow[m - 1];
      // Put it together and save in the current row:
      const distance = Math.min(deleteCost, insertCost, replaceCost);
      row[m] = distance;
    }
  }
  return row[s2.length];
}
