const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orderController');

// ✅ API Route

router.post('/create-order', createOrder);

module.exports = router;
