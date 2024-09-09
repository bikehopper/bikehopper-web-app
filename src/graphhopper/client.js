import axios from 'axios';
import {
  PROTOCOL,
  GRAPHHOPPER_SERVICE_NAME,
} from '../config.js';

const client = axios.create({
  baseURL: `${PROTOCOL}://${GRAPHHOPPER_SERVICE_NAME}/`,
  timeout: 10 * 1000
});

export default client;
