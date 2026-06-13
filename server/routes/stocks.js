const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStockData, getAllStocks, searchStocks } = require('../engine/marketEngine');

// GET /api/stocks/search?q=
router.get('/search', protect, (req, res) => {
  try {
    const results = searchStocks(req.query.q || '');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Error searching stocks' });
  }
});

// GET /api/stocks/:symbol
router.get('/:symbol', protect, (req, res) => {
  const data = getStockData(req.params.symbol);
  if (!data) return res.status(404).json({ message: 'Stock symbol not found' });
  res.json(data);
});

module.exports = router;
