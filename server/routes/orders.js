const express = require('express');
const router  = express.Router();
const { placeLimitOrderRoute, getMyOrders, cancelLimitOrder, getSymbolOrderBook } = require('../controllers/ordersController');
const { protect } = require('../middleware/authMiddleware');

router.post('/limit',        protect, placeLimitOrderRoute);
router.get('/',              protect, getMyOrders);
router.delete('/:orderId',   protect, cancelLimitOrder);
router.get('/book/:symbol',  protect, getSymbolOrderBook);

module.exports = router;
