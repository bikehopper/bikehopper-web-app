import express from 'express';
import photonClient from './client.js';

const router = express.Router();

async function geocodeCb (req: any, res: any) {
  try {
    const resp = await photonClient.request({
      method: 'get',
      url: '/api',
      params: req.query
    });
    res.json(resp.data);
  } catch (error) {
    if ((error as any).response) {
      res.sendStatus((error as any).response.status);
    }
    else {
      res.sendStatus(500);
    }
  }
  res.end();
}

router.get('/', geocodeCb);

router.get('/geocode', geocodeCb);

export default router;
