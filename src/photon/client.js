import axios from 'axios';
import {
  PROTOCOL,
  PHOTON_SERVICE_NAME,
} from '../config.js';

const client = axios.create({
  baseURL: `${PROTOCOL}://${PHOTON_SERVICE_NAME}/`,
  timeout: 2000
});

export default client;
