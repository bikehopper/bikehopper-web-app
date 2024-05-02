import axios from 'axios';
import {
  GTFS_REALTIME_TOKEN,
  GTFS_REALTIME_VEHICLE_POSITION_TOKEN,
  GTFS_REALTIME_TRIP_UPDATES_TOKEN,
  GTFS_REALTIME_SERVICE_ALERTS_TOKEN,
} from '../config.js';

const timeout = 10000;

export default axios.create({
  timeout,
  params: {
    api_key: GTFS_REALTIME_TOKEN
  },
});

export const vehiclePositionClient = axios.create({
  timeout,
  params: {
    api_key: GTFS_REALTIME_VEHICLE_POSITION_TOKEN || GTFS_REALTIME_TOKEN
  },
});

export const tripUpdateClient = axios.create({
  timeout,
  params: {
    api_key: GTFS_REALTIME_TRIP_UPDATES_TOKEN || GTFS_REALTIME_TOKEN
  },
});

export const serviceAlertsClient = axios.create({
  timeout,
  params: {
    api_key: GTFS_REALTIME_SERVICE_ALERTS_TOKEN || GTFS_REALTIME_TOKEN
  },
});
