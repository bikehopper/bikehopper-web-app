const express = require('express');
const router = express.Router();
const photonClient = require('./client');
const logger = require('../lib/logger');

router.get('/geocode', async (req, res) => {
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/api',
      params: req.query
    });
    res.json(resp.data);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
      res.send(error.response.data);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
});

router.get('/reverse', async (req, res) => {
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/reverse',
      params: req.query
    });
    res.json(resp.data);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
      res.send(error.response.data);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
});

module.exports = router;
