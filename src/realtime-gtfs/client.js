import axios from 'axios';

const timeout = 10000;

export default axios.create({
  timeout,
});

export const vehiclePositionClient = axios.create({
  timeout,
});

export const tripUpdateClient = axios.create({
  timeout,
});

