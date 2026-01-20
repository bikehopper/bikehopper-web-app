import fs from 'fs';

export const GEO_CONFIG_FOLDER_PATH = 'config/geoconfigs';
const regionConfig = JSON.parse(fs.readFileSync('data/region-config.json', 'utf8'));
export const REGION_CONFIG = regionConfig;

export const GTFS_REALTIME_ROOT_URL = process.env.GTFS_REALTIME_ROOT_URL ?? 'https://data.bikehopper.org';

export const GTFS_REALTIME_ALERTS_URL = `${GTFS_REALTIME_ROOT_URL}/rt/service_alerts.pbf`;
export const GTFS_REALTIME_VEHICLE_POSITIONS_URL = `${GTFS_REALTIME_ROOT_URL}/rt/vehicle_positions.pbf`;
export const GTFS_REALTIME_TRIP_UPDATES_URL = `${GTFS_REALTIME_ROOT_URL}/rt/trip_updates.pbf`;
