const axios = require('axios');
const {
  PHOTON_PROTOCAL,
  PHOTON_SERVICE_NAME,
  HOSTNAME,
  NAMESPACE
} = require('../config');

const client = axios.create({
  baseURL: `${PHOTON_PROTOCAL}://${PHOTON_SERVICE_NAME}.${NAMESPACE}.${HOSTNAME}/`,
  timeout: 2000
});

module.exports = client;
