import axios from 'axios';
import {
  NOMINATIM_SERVICE_NAME,
} from '../config.js';

const client = axios.create({
  baseURL: `http://${NOMINATIM_SERVICE_NAME}/`,
  timeout: 2000
});

export default client;
