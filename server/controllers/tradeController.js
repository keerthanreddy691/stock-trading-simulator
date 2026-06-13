const User        = require('../models/User');
const Portfolio   = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const { getStockData, marketEvents } = require('../engine/marketEngine');

// POST /api/trade/buy
const buyStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0)
      return res.status(400).json({ message: 'Symbol and a positive quantity are required' });

    const stockData = getStockData(symbol);
    if (!stockData) return res.status(404).json({ message: 'Stock not found in market data' });

    const { price, companyName, sector } = stockData;
    const totalCost = parseFloat((price * quantity).toFixed(2));

    const user = await User.findById(req.user.id);
    if (user.virtualBalance < totalCost)
      return res.status(400).json({ message: `Insufficient balance. Need $${totalCost.toFixed(2)}, have $${user.virtualBalance.toFixed(2)}` });

    user.virtualBalance = parseFloat((user.virtualBalance - totalCost).toFixed(2));
    await user.save();

    let portfolio = await Portfolio.findOne({ userId: req.user.id });
    if (!portfolio) portfolio = new Portfolio({ userId: req.user.id, stocks: [] });

    const idx = portfolio.stocks.findIndex((s) => s.symbol === symbol.toUpperCase());
    if (idx >= 0) {
      const existing    = portfolio.stocks[idx];
      const newQty      = existing.quantity + quantity;
      const newAvgPrice = ((existing.avgBuyPrice * existing.quantity) + totalCost) / newQty;
      portfolio.stocks[idx].quantity    = newQty;
      portfolio.stocks[idx].avgBuyPrice = parseFloat(newAvgPrice.toFixed(4));
    } else {
      portfolio.stocks.push({ symbol: symbol.toUpperCase(), companyName, sector, quantity, avgBuyPrice: price });
    }
    await portfolio.save();

    const tx = await Transaction.create({
      userId: req.user.id, symbol: symbol.toUpperCase(), companyName, sector,
      type: 'BUY', orderType: 'MARKET', quantity,
      priceAtTransaction: price, totalAmount: totalCost,
    });

    // Emit trade event for the market event stream
    marketEvents.emit('trade', {
      type: 'BUY', symbol: symbol.toUpperCase(), quantity, price, userId: req.user.id, timestamp: tx.timestamp,
    });

    res.json({
      message: `Successfully bought ${quantity} share${quantity > 1 ? 's' : ''} of ${symbol.toUpperCase()} at $${price}`,
      virtualBalance: user.virtualBalance,
      portfolio: portfolio.stocks,
    });
  } catch (err) {
    console.error('Buy error:', err);
    res.status(500).json({ message: 'Server error while processing buy order' });
  }
};

// POST /api/trade/sell
const sellStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0)
      return res.status(400).json({ message: 'Symbol and a positive quantity are required' });

    const upperSym = symbol.toUpperCase();
    const portfolio = await Portfolio.findOne({ userId: req.user.id });
    if (!portfolio) return res.status(400).json({ message: 'Portfolio not found' });

    const idx = portfolio.stocks.findIndex((s) => s.symbol === upperSym);
    if (idx === -1) return res.status(400).json({ message: 'You do not own this stock' });

    const stock = portfolio.stocks[idx];
    if (stock.quantity < quantity)
      return res.status(400).json({ message: `You only own ${stock.quantity} shares — cannot sell ${quantity}` });

    const stockData = getStockData(symbol);
    if (!stockData) return res.status(404).json({ message: 'Stock not found in market data' });

    const { price, companyName, sector } = stockData;
    const totalCredit  = parseFloat((price * quantity).toFixed(2));
    const costBasis    = parseFloat((stock.avgBuyPrice * quantity).toFixed(2));
    const realisedPL   = parseFloat((totalCredit - costBasis).toFixed(2));

    const user = await User.findById(req.user.id);
    user.virtualBalance = parseFloat((user.virtualBalance + totalCredit).toFixed(2));
    await user.save();

    portfolio.stocks[idx].quantity -= quantity;
    if (portfolio.stocks[idx].quantity === 0) portfolio.stocks.splice(idx, 1);
    await portfolio.save();

    const tx = await Transaction.create({
      userId: req.user.id, symbol: upperSym, companyName, sector,
      type: 'SELL', orderType: 'MARKET', quantity,
      priceAtTransaction: price, totalAmount: totalCredit,
      costBasis, realisedPL,
    });

    marketEvents.emit('trade', {
      type: 'SELL', symbol: upperSym, quantity, price, realisedPL, userId: req.user.id, timestamp: tx.timestamp,
    });

    res.json({
      message: `Successfully sold ${quantity} share${quantity > 1 ? 's' : ''} of ${upperSym} at $${price} (P&L: ${realisedPL >= 0 ? '+' : ''}$${realisedPL})`,
      virtualBalance: user.virtualBalance,
      portfolio: portfolio.stocks,
      realisedPL,
    });
  } catch (err) {
    console.error('Sell error:', err);
    res.status(500).json({ message: 'Server error while processing sell order' });
  }
};

module.exports = { buyStock, sellStock };
