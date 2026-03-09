import axios from 'axios';
import {
  PHOTON_SERVICE_NAME,
} from '../config.js';

const client = axios.create({
  baseURL: `http://${PHOTON_SERVICE_NAME}/`,
  timeout: 2000
});

export default client;
