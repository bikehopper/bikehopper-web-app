const axios = require('axios');
const { GRAPHHOPPER_SERVICE_NAME, NAMESPACE } = require('../config');

const client = axios.create({
  baseURL: `http://${GRAPHHOPPER_SERVICE_NAME}.${NAMESPACE}.svc.cluster.local/`,
  timeout: 2000
});

module.exports = client;
