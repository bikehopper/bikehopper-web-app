import express from 'express';

import fileClient from './client.js';
import logger from '../lib/logger.js';

const router = express.Router();

const routes = [
  ["get", "/fit"],
  ["get", "/health"],
];

routes.forEach(([method, path]) => {
  router[method](path, async (req, res) => {
    try {
      const resp = await fileClient.request({
        method: method,
        url: path,
        params: req.query,
      });
      res.send(resp.data);
    } catch (error) {
      logger.error(error);

      if (error.response) {
        res.sendStatus(error.response.status);
      } else {
        res.sendStatus(500);
      }
    }
  });
});

export default router;
