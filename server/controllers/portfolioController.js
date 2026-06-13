const Portfolio   = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const { getStockData } = require('../engine/marketEngine');

// GET /api/portfolio
const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user.id });

    if (!portfolio || portfolio.stocks.length === 0) {
      return res.json({ stocks: [], summary: { totalInvested: 0, currentValue: 0, totalPL: 0, totalPLPercent: 0 } });
    }

    let totalInvested = 0;
    let currentValue  = 0;

    const enriched = portfolio.stocks.map((stock) => {
      const live         = getStockData(stock.symbol);
      const currentPrice = live ? live.price : stock.avgBuyPrice;
      const changePercent = live ? live.changePercent : 0;
      const totalCost    = stock.quantity * stock.avgBuyPrice;
      const stockValue   = stock.quantity * currentPrice;
      const pl           = stockValue - totalCost;
      const plPercent    = totalCost > 0 ? (pl / totalCost) * 100 : 0;

      totalInvested += totalCost;
      currentValue  += stockValue;

      return {
        symbol: stock.symbol, companyName: stock.companyName, sector: stock.sector,
        quantity: stock.quantity, avgBuyPrice: stock.avgBuyPrice,
        currentPrice, changePercent,
        totalCost:    parseFloat(totalCost.toFixed(2)),
        currentValue: parseFloat(stockValue.toFixed(2)),
        pl:           parseFloat(pl.toFixed(2)),
        plPercent:    parseFloat(plPercent.toFixed(2)),
      };
    });

    const totalPL        = currentValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    res.json({
      stocks: enriched,
      summary: {
        totalInvested:  parseFloat(totalInvested.toFixed(2)),
        currentValue:   parseFloat(currentValue.toFixed(2)),
        totalPL:        parseFloat(totalPL.toFixed(2)),
        totalPLPercent: parseFloat(totalPLPercent.toFixed(2)),
      },
    });
  } catch (err) {
    console.error('Get portfolio error:', err);
    res.status(500).json({ message: 'Server error loading portfolio' });
  }
};

// GET /api/portfolio/history
const getTransactionHistory = async (req, res) => {
  try {
    const { type, symbol, limit = 100 } = req.query;
    const filter = { userId: req.user.id };
    if (type && ['BUY', 'SELL'].includes(type.toUpperCase())) filter.type = type.toUpperCase();
    if (symbol) filter.symbol = symbol.toUpperCase();

    const transactions = await Transaction.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(transactions);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Server error loading history' });
  }
};

module.exports = { getPortfolio, getTransactionHistory };
