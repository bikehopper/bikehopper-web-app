const axios = require('axios');
const {
  PROTOCOL,
  GRAPHHOPPER_SERVICE_NAME,
  HOSTNAME,
  NAMESPACE
} = require('../config');

const _hostname = [GRAPHHOPPER_SERVICE_NAME, NAMESPACE, HOSTNAME].filter(s => !!s).join('.');

const client = axios.create({
  baseURL: `${PROTOCOL}://${_hostname}/`,
  timeout: 10 * 1000
});

module.exports = client;
