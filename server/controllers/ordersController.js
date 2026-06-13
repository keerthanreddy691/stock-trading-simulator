const LimitOrder = require('../models/LimitOrder');
const User       = require('../models/User');
const Portfolio  = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const { placeLimitOrder, cancelOrder: cancelEngineOrder, getOrderBook, getStockData, marketEvents } = require('../engine/marketEngine');

// POST /api/orders/limit
const placeLimitOrderRoute = async (req, res) => {
  try {
    const { symbol, type, quantity, limitPrice } = req.body;

    if (!symbol || !type || !quantity || !limitPrice)
      return res.status(400).json({ message: 'symbol, type, quantity, and limitPrice are required' });
    if (!['BUY', 'SELL'].includes(type.toUpperCase()))
      return res.status(400).json({ message: 'Order type must be BUY or SELL' });
    if (quantity <= 0 || limitPrice <= 0)
      return res.status(400).json({ message: 'Quantity and price must be positive' });

    const upperSym = symbol.toUpperCase();

    // Pre-checks
    if (type.toUpperCase() === 'BUY') {
      const user = await User.findById(req.user.id);
      const required = quantity * limitPrice;
      if (user.virtualBalance < required)
        return res.status(400).json({ message: `Insufficient balance. Need $${required.toFixed(2)}` });
    } else {
      const portfolio = await Portfolio.findOne({ userId: req.user.id });
      const holding   = portfolio?.stocks.find((s) => s.symbol === upperSym);
      if (!holding || holding.quantity < quantity)
        return res.status(400).json({ message: 'Insufficient shares to place sell limit order' });
    }

    // Try matching in engine
    const result = placeLimitOrder(req.user.id, upperSym, type.toUpperCase(), quantity, limitPrice);

    if (result.matched) {
      // Execute the matched trade immediately
      const stockData = getStockData(upperSym);
      const execPrice = result.executedAt;
      const totalAmt  = parseFloat((execPrice * quantity).toFixed(2));

      const user = await User.findById(req.user.id);
      if (type.toUpperCase() === 'BUY') {
        user.virtualBalance = parseFloat((user.virtualBalance - totalAmt).toFixed(2));
      } else {
        user.virtualBalance = parseFloat((user.virtualBalance + totalAmt).toFixed(2));
      }
      await user.save();

      // Update portfolio
      let portfolio = await Portfolio.findOne({ userId: req.user.id });
      if (!portfolio) portfolio = new Portfolio({ userId: req.user.id, stocks: [] });

      if (type.toUpperCase() === 'BUY') {
        const idx = portfolio.stocks.findIndex((s) => s.symbol === upperSym);
        if (idx >= 0) {
          const ex = portfolio.stocks[idx];
          const nq = ex.quantity + quantity;
          portfolio.stocks[idx].avgBuyPrice = ((ex.avgBuyPrice * ex.quantity) + totalAmt) / nq;
          portfolio.stocks[idx].quantity = nq;
        } else {
          portfolio.stocks.push({ symbol: upperSym, companyName: stockData?.companyName || upperSym, sector: stockData?.sector || 'Unknown', quantity, avgBuyPrice: execPrice });
        }
      } else {
        const idx = portfolio.stocks.findIndex((s) => s.symbol === upperSym);
        if (idx >= 0) {
          portfolio.stocks[idx].quantity -= quantity;
          if (portfolio.stocks[idx].quantity === 0) portfolio.stocks.splice(idx, 1);
        }
      }
      await portfolio.save();

      await Transaction.create({
        userId: req.user.id, symbol: upperSym,
        companyName: stockData?.companyName || upperSym,
        sector: stockData?.sector || 'Unknown',
        type: type.toUpperCase(), orderType: 'LIMIT',
        quantity, priceAtTransaction: execPrice, totalAmount: totalAmt,
      });

      await LimitOrder.create({ ...result, userId: req.user.id, symbol: upperSym, type: type.toUpperCase(), quantity, limitPrice, status: 'FILLED', filledAt: execPrice });

      return res.json({ message: `Limit order matched and filled at $${execPrice}`, status: 'FILLED', executedAt: execPrice, virtualBalance: user.virtualBalance });
    }

    // Not matched — save as PENDING
    await LimitOrder.create({ orderId: result.orderId, userId: req.user.id, symbol: upperSym, type: type.toUpperCase(), quantity, limitPrice, status: 'PENDING' });

    res.json({ message: result.message, status: 'PENDING', orderId: result.orderId });
  } catch (err) {
    console.error('Limit order error:', err);
    res.status(500).json({ message: 'Server error placing limit order' });
  }
};

// GET /api/orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await LimitOrder.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// DELETE /api/orders/:orderId
const cancelLimitOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await LimitOrder.findOne({ orderId, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'PENDING') return res.status(400).json({ message: 'Only pending orders can be cancelled' });

    cancelEngineOrder(order.symbol, orderId, req.user.id);
    order.status    = 'CANCELLED';
    order.updatedAt = new Date();
    await order.save();

    res.json({ message: `Order ${orderId} cancelled successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling order' });
  }
};

// GET /api/orders/book/:symbol
const getSymbolOrderBook = async (req, res) => {
  try {
    const book = getOrderBook(req.params.symbol);
    if (!book) return res.status(404).json({ message: 'Symbol not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order book' });
  }
};

module.exports = { placeLimitOrderRoute, getMyOrders, cancelLimitOrder, getSymbolOrderBook };
