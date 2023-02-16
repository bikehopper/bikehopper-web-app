import axios from 'axios';
import {
  PROTOCOL,
  PHOTON_SERVICE_NAME,
  HOSTNAME,
  NAMESPACE
} from '../config.js';

const client = axios.create({
  baseURL: `${PROTOCOL}://${PHOTON_SERVICE_NAME}.${NAMESPACE}.${HOSTNAME}/`,
  timeout: 2000
});

export default client;
