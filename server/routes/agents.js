const express = require('express');
const router = express.Router();
const { listAgents } = require('../services/agent-loader');

router.get('/', (req, res) => {
  res.json(listAgents());
});

module.exports = router;
