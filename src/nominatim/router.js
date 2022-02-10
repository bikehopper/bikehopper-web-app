const express = require('express');
const router = express.Router();
const photonClient = require('./client');
const logger = require('../lib/logger');

router.get('/search', async (req, res) => {
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/search',
      params: req.query
    });
    res.json(resp.data);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
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
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
});

router.get('/lookup', async (req, res) => {
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/lookup',
      params: req.query
    });
    res.json(resp.data);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
});

router.get('/details', async (req, res) => {
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/details',
      params: req.query
    });
    res.json(resp.data);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
});

router.get('/status', async (req, res) => {
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/status',
      params: req.query
    });
    res.json(resp.data);
  } catch (error) {
    if (error.response) {
      res.sendStatus(error.response.status);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
});

module.exports = router;
