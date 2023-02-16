import axios from 'axios';
import {
  PROTOCOL,
  GRAPHHOPPER_SERVICE_NAME,
  HOSTNAME,
  NAMESPACE
} from '../config.js';

const _hostname = [GRAPHHOPPER_SERVICE_NAME, NAMESPACE, HOSTNAME].filter(s => !!s).join('.');

const client = axios.create({
  baseURL: `${PROTOCOL}://${_hostname}/`,
  timeout: 10 * 1000
});

export default client;
