import Keyv from 'keyv';
import {
    CACHE_CONN_STRING,
  } from '../config.js';

const keyv = new Keyv(CACHE_CONN_STRING);

export default keyv;