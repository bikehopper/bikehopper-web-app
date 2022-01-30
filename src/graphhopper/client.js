const axios = require('axios');
const {
  GRAPHHOPPER_PROTOCAL,
  GRAPHHOPPER_SERVICE_NAME,
  HOSTNAME,
  NAMESPACE
} = require('../config');

const client = axios.create({
  baseURL: `${GRAPHHOPPER_PROTOCAL}://${GRAPHHOPPER_SERVICE_NAME}.${NAMESPACE}.${HOSTNAME}/`,
  timeout: 2000
});

module.exports = client;
