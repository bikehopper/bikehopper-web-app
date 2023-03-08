import axios from 'axios';
import {
  PROTOCOL,
  NOMINATIM_SERVICE_NAME,
  HOSTNAME,
  NAMESPACE
} from '../config.js';

const client = axios.create({
  baseURL: `${PROTOCOL}://${NOMINATIM_SERVICE_NAME}.${NAMESPACE}.${HOSTNAME}/`,
  timeout: 2000
});

export default client;
