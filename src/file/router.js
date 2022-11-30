const express = require('express');
const router = express.Router();
const fileClient = require('./client');
const logger = require('../lib/logger');

router.get('/fit', async (req, res) => {
  try {
    const resp = await fileClient.request({
      method: 'get',
      url: '/fit',
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
