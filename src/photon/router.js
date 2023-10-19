import express from 'express';
import photonClient from './client.js';
import logger from '../lib/logger.js';

const router = express.Router();

async function geocodeCb (req, res) {
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
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
}

router.get('/', geocodeCb);

// TODO: remove in next release
router.get('/geocode', geocodeCb);

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

export default router;
