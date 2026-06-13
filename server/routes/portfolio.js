const express = require('express');
const router  = express.Router();
const { getPortfolio, getTransactionHistory } = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',        protect, getPortfolio);
router.get('/history', protect, getTransactionHistory);

module.exports = router;
