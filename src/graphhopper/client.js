const axios = require('axios');
const { GRAPHHOPPER_SERVICE_NAME, NAMESPACE, HOSTNAME} = require('../config');

const client = axios.create({
  baseURL: `http://${GRAPHHOPPER_SERVICE_NAME}.${NAMESPACE}.${HOSTNAME}/`,
  timeout: 2000
});

module.exports = client;
