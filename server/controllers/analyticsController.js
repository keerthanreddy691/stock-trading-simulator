const Transaction = require('../models/Transaction');
const Portfolio   = require('../models/Portfolio');
const { getStockData } = require('../engine/marketEngine');

// GET /api/analytics/summary
const getAnalyticsSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // All transactions for this user
    const txs = await Transaction.find({ userId }).sort({ timestamp: 1 });

    // Realised P&L from closed sell orders
    const sellTxs = txs.filter((t) => t.type === 'SELL');
    const realisedPL    = parseFloat(sellTxs.reduce((sum, t) => sum + (t.realisedPL || 0), 0).toFixed(2));
    const totalTrades   = txs.length;
    const winningTrades = sellTxs.filter((t) => (t.realisedPL || 0) > 0).length;
    const losingTrades  = sellTxs.filter((t) => (t.realisedPL || 0) < 0).length;
    const winRate       = sellTxs.length > 0 ? parseFloat(((winningTrades / sellTxs.length) * 100).toFixed(1)) : 0;

    // Unrealised P&L from current portfolio
    const portfolio = await Portfolio.findOne({ userId });
    let unrealisedPL = 0;
    let sectorAllocation = {};

    if (portfolio && portfolio.stocks.length > 0) {
      portfolio.stocks.forEach((stock) => {
        const live         = getStockData(stock.symbol);
        const currentPrice = live ? live.price : stock.avgBuyPrice;
        const pl           = (currentPrice - stock.avgBuyPrice) * stock.quantity;
        unrealisedPL += pl;

        const sec = stock.sector || 'Unknown';
        const val = currentPrice * stock.quantity;
        sectorAllocation[sec] = (sectorAllocation[sec] || 0) + val;
      });
    }

    unrealisedPL = parseFloat(unrealisedPL.toFixed(2));

    // Sector allocation as array sorted by value
    const sectorData = Object.entries(sectorAllocation)
      .map(([sector, value]) => ({ sector, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    // Monthly P&L for the equity chart — group SELL realisedPL by month
    const monthlyPL = {};
    sellTxs.forEach((t) => {
      const key = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyPL[key] = parseFloat(((monthlyPL[key] || 0) + (t.realisedPL || 0)).toFixed(2));
    });
    const equityCurve = Object.entries(monthlyPL).map(([month, pl]) => ({ month, pl }));

    // Top performing assets (by realised P&L per sell)
    const bySymbol = {};
    sellTxs.forEach((t) => {
      if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { symbol: t.symbol, companyName: t.companyName, realisedPL: 0, trades: 0 };
      bySymbol[t.symbol].realisedPL += t.realisedPL || 0;
      bySymbol[t.symbol].trades += 1;
    });
    const topAssets = Object.values(bySymbol)
      .map((a) => ({ ...a, realisedPL: parseFloat(a.realisedPL.toFixed(2)) }))
      .sort((a, b) => b.realisedPL - a.realisedPL)
      .slice(0, 5);

    res.json({
      realisedPL,
      unrealisedPL,
      totalPL: parseFloat((realisedPL + unrealisedPL).toFixed(2)),
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      sectorAllocation: sectorData,
      equityCurve,
      topAssets,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error loading analytics' });
  }
};

module.exports = { getAnalyticsSummary };
