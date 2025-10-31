import fs from 'fs';

export const GEO_CONFIG_FOLDER_PATH = 'config/geoconfigs';
const regionConfig = JSON.parse(fs.readFileSync('data/region-config.json', 'utf8'));
export const REGION_CONFIG = regionConfig;

export const GTFS_REALTIME_ALERTS_URL = regionConfig.gtfsRtUrls?.alerts;
export const GTFS_REALTIME_VEHICLE_POSITIONS_URL =
regionConfig.gtfsRtUrls?.vehiclePositions;
export const GTFS_REALTIME_TRIP_UPDATES_URL = regionConfig.gtfsRtUrls?.tripUpdates;
