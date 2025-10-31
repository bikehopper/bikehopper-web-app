export const GEO_CONFIG_FOLDER_PATH = 'config/geoconfigs';
const regionConfig = JSON.parse(fs.readFileSync('data/region-config.json', 'utf8'));
export const REGION_CONFIG = regionConfig;
