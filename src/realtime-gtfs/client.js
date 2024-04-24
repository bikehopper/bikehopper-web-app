import axios from 'axios';
import {
  GTFS_REALTIME_TOKEN,
} from '../config.js';

const client = axios.create({
  timeout: 2000,
  params: {
    api_key: GTFS_REALTIME_TOKEN
  }
});

export default client;
