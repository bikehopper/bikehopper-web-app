const express = require('express');
const router = express.Router();
const photonClient = require('./client');
const logger = require('../lib/logger');

router.get('/geocode', async (req, res) => {
  logger.info('triggered /geocode');
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/api',
      params: req.query
    });
    logger.info('/geocode successful call to photon');
    res.json(resp.data);
  } catch (error) {
    logger.info('error');
    if (error.response) {
      if (error.response.status > 499) {
        logger.error(error);
      }
      res.sendStatus(error.response.status);
      res.send(error.response.data);
    }
    else {
      logger.info('some weird error');
      logger.error(error);
      res.sendStatus(500);
    }
  }
  res.end();
});

router.get('/reverse', async (req, res) => {
  logger.info('triggered /reverse');
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/reverse',
      params: req.query
    });
    logger.info('/reverse successful call to photon');
    res.json(resp.data);
  } catch (error) {
    logger.info('error');
    if (error.response) {
      if (error.response.status > 499) {
        logger.error(error);
      }
      res.sendStatus(error.response.status);
      res.send(error.response.data);
    }
    else {
      logger.info('some weird error');
      logger.error(error);
      res.sendStatus(500);
    }
  }
  res.end();
});

module.exports = router;
