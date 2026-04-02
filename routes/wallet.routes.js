const { Router } = require('express');
const { createWallet } = require('../controllers/wallet.controller');
const { writeLimiter } = require('../middleware/rateLimit.middleware');

const router = Router();

router.post('/', writeLimiter, createWallet);

module.exports = router;
