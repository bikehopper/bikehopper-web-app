const express = require("express");
const router = express.Router();
const fileClient = require("./client");
const logger = require("../lib/logger");

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

module.exports = router;
