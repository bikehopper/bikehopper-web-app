import axios from 'axios';
import {
  GRAPHHOPPER_SERVICE_NAME,
} from '../config.js';

const client = axios.create({
  baseURL: `http://${GRAPHHOPPER_SERVICE_NAME}/`,
  timeout: 10 * 1000
});

export default client;
