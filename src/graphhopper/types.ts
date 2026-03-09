import type { ElevatorInfo } from '../lib/elevator-types.js';
import type { InstructionSign } from './InstructionSigns.js';
import type { Mode } from './TransitMode.js';

export type RouteInstruction = {
  text: string;
  street_name?: string;
  distance: number;
  time: number;
  interval: number[];
  sign: InstructionSign;
  heading?: number;
  exit_number?: number;
  turn_angle?: number;
};

export type InstructionDetails = Record<string, [number, number, string][]>;

type BikeLegBase = {
  type: 'bike2';
  departure_location: string;
  geometry: GeoJSON.LineString;
  distance: number;
  weight: number;
  interpolated: boolean;
  instructions: RouteInstruction[];
  details: InstructionDetails;
  ascend: number;
  descend: number;
};
export type BikeLegRaw = BikeLegBase & {
  departure_time: string; // ISO-8601
  arrival_time: string; // ISO-8601
};

type TransitLegBase = {
  type: 'pt';
  departure_location: string;
  geometry: GeoJSON.LineString;
  distance: number;
  weight: number;
  interpolated: boolean;
  feed_id: string;
  agency_id: string;
  agency_name: string;
  is_in_same_vehicle_as_previous: boolean;
  trip_headsign: string;
  route_color?: string;
  route_name?: string;
  route_type: Mode;
  bikes_allowed: number;
  travel_time: number;
  stops: TransitStop[];
  trip_id: string;
  route_id: string;
  all_stop_ids?: string[];
  alerts?: TransitAlert[];
};
export type TransitLegRaw = TransitLegBase & {
  departure_time: string; // ISO-8601
  arrival_time: string; // ISO-8601
};

export type LegRaw = TransitLegRaw | BikeLegRaw;
export type TransitStop = {
  stop_id: string;
  stop_name: string;
  geometry: GeoJSON.Point;
  arrival_cancelled: boolean;
  departure_time: string; // ISO-8601
  planned_departure_time: string; // ISO-8601
  departure_cancelled: boolean;
  elevators?: ElevatorInfo[];
};

export type TransitAlert = {
  entities: {
    stop_id: string | null;
    trip_id: string | null;
    route_type: number | null;
    route_id: string | null;
    agency_id: string | null;
  }[];
  time_ranges: {
    start: number; // epoch timestamp
    end: number; // epoch timestamp
  }[];
  header_text: TransitAlertTextField;
  description_text: TransitAlertTextField;
  cause: number;
  effect: number;
  severity_level: number;
};
type TransitAlertTextField = {
  translation: {
    language: string;
    text: string;
  }[];
};
type RouteResponsePathBase = {
  distance: number;
  time: number;
  ascend: number;
  descend: number;
  // We always send points_encoded=false, so this is a line string:
  points: GeoJSON.LineString;
  snapped_waypoints: GeoJSON.LineString;
  points_encoded: boolean;
  bbox: [number, number, number, number];
  instructions: RouteInstruction[];
  weight: number;
  transfers: number;
  details: InstructionDetails;
};

export type RouteResponsePathRaw = RouteResponsePathBase & {
  legs: LegRaw[];
};

export type RouteResponse = { paths: RouteResponsePathRaw[] };
