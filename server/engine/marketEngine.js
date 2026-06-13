/**
 * Market Engine
 * Drives price simulation, emits event streams, and handles an order-matching queue.
 * All routes share the same singleton state so prices stay consistent per session.
 */

const EventEmitter = require('events');

// ─── Market Event Bus ────────────────────────────────────────────────────────
// Other modules can subscribe to 'trade' and 'price_update' events.
const marketEvents = new EventEmitter();
marketEvents.setMaxListeners(50);

// ─── Stock Universe ─────────────────────────────────────────────────────────
const BASE_STOCKS = [
  { symbol: 'AAPL',  name: 'Apple Inc.',          price: 189.50, sector: 'Technology'   },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',        price: 141.20, sector: 'Technology'   },
  { symbol: 'TSLA',  name: 'Tesla Inc.',           price: 245.00, sector: 'Automotive'   },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',      price: 415.30, sector: 'Technology'   },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',      price: 185.70, sector: 'E-Commerce'   },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',         price: 875.40, sector: 'Semiconductors'},
  { symbol: 'META',  name: 'Meta Platforms',       price: 505.20, sector: 'Social Media' },
  { symbol: 'NFLX',  name: 'Netflix Inc.',         price: 628.10, sector: 'Entertainment'},
  { symbol: 'JPM',   name: 'JPMorgan Chase',       price: 198.40, sector: 'Finance'      },
  { symbol: 'V',     name: 'Visa Inc.',            price: 272.60, sector: 'Finance'      },
  { symbol: 'JNJ',   name: 'Johnson & Johnson',    price: 147.80, sector: 'Healthcare'   },
  { symbol: 'WMT',   name: 'Walmart Inc.',         price: 165.90, sector: 'Retail'       },
];

// ─── Market State ─────────────────────────────────────────────────────────────
const stockStore = {};

// Pending order book: { symbol -> { bids: [], asks: [] } }
// Each entry: { orderId, userId, type:'BUY'|'SELL', quantity, limitPrice, timestamp }
const orderBook = {};

const initMarket = () => {
  const today = new Date();

  BASE_STOCKS.forEach((stock) => {
    const history = [];
    let price = stock.price * 0.92; // start 8% below base for visual uptrend

    for (let i = 30; i > 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const delta = (Math.random() * 3 - 1.3) / 100; // slight upward bias
      price = Math.max(price * (1 + delta), 1);
      history.push({ date: label, price: parseFloat(price.toFixed(2)) });
    }

    stockStore[stock.symbol] = {
      symbol:      stock.symbol,
      companyName: stock.name,
      sector:      stock.sector,
      basePrice:   stock.price,
      currentPrice: parseFloat(price.toFixed(2)),
      openPrice:   parseFloat(price.toFixed(2)),
      high:        parseFloat(price.toFixed(2)),
      low:         parseFloat(price.toFixed(2)),
      volume:      Math.floor(Math.random() * 5_000_000) + 500_000,
      history,
    };

    orderBook[stock.symbol] = { bids: [], asks: [] };
  });
};

initMarket();

// ─── Price Tick ───────────────────────────────────────────────────────────────
// Called externally (server.js interval) and on each getStockData() call.
const tickPrice = (symbol) => {
  const s = stockStore[symbol];
  if (!s) return null;

  // Realistic random walk with mean reversion toward base price
  const gap       = (s.basePrice - s.currentPrice) / s.basePrice;
  const reversion = gap * 0.005; // gentle pull back toward base
  const noise     = (Math.random() * 1.2 - 0.6) / 100;
  let newPrice    = s.currentPrice * (1 + noise + reversion);

  // Hard guardrails: ±25% of base
  newPrice = Math.min(newPrice, s.basePrice * 1.25);
  newPrice = Math.max(newPrice, s.basePrice * 0.75);
  newPrice = parseFloat(newPrice.toFixed(2));

  // Update intraday stats
  s.currentPrice = newPrice;
  s.high  = Math.max(s.high, newPrice);
  s.low   = Math.min(s.low,  newPrice);
  s.volume += Math.floor(Math.random() * 10000);

  // Rolling 30-day history — update today's candle
  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const last = s.history[s.history.length - 1];
  if (last && last.date === todayLabel) {
    last.price = newPrice;
  } else {
    if (s.history.length >= 30) s.history.shift();
    s.history.push({ date: todayLabel, price: newPrice });
  }

  const change        = parseFloat((newPrice - s.basePrice).toFixed(2));
  const changePercent = parseFloat(((change / s.basePrice) * 100).toFixed(2));

  marketEvents.emit('price_update', { symbol, price: newPrice, change, changePercent });

  return {
    symbol:       s.symbol,
    companyName:  s.companyName,
    sector:       s.sector,
    price:        newPrice,
    change,
    changePercent,
    open:         s.openPrice,
    high:         s.high,
    low:          s.low,
    volume:       s.volume,
    history:      s.history,
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────
const getStockData = (symbol) => tickPrice(symbol.toUpperCase());

const getAllStocks = () =>
  BASE_STOCKS.map((s) => tickPrice(s.symbol)).filter(Boolean);

const searchStocks = (query) => {
  const q = (query || '').toLowerCase();
  return BASE_STOCKS
    .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    .map((s) => tickPrice(s.symbol))
    .filter(Boolean);
};

// ─── Order Book ───────────────────────────────────────────────────────────────
// Adds a limit order to the book and tries to match immediately.
const placeLimitOrder = (userId, symbol, type, quantity, limitPrice) => {
  const sym = symbol.toUpperCase();
  if (!orderBook[sym]) return { matched: false, error: 'Unknown symbol' };

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const order   = { orderId, userId, type, quantity, limitPrice, timestamp: new Date() };

  const book = orderBook[sym];

  // Try to match against opposite side
  const opposite = type === 'BUY' ? 'asks' : 'bids';
  const side     = type === 'BUY' ? 'bids' : 'asks';

  const matchCondition = (pending) =>
    type === 'BUY'
      ? pending.limitPrice <= limitPrice   // ask price ≤ our bid
      : pending.limitPrice >= limitPrice;  // bid price ≥ our ask

  const matchable = book[opposite].find(matchCondition);

  if (matchable) {
    // Remove matched order from book
    book[opposite] = book[opposite].filter((o) => o.orderId !== matchable.orderId);

    marketEvents.emit('trade', {
      symbol: sym,
      buyerId:  type === 'BUY' ? userId : matchable.userId,
      sellerId: type === 'SELL' ? userId : matchable.userId,
      quantity: Math.min(quantity, matchable.quantity),
      price:    matchable.limitPrice,
      timestamp: new Date(),
    });

    return { matched: true, orderId, executedAt: matchable.limitPrice };
  }

  // No match → add to order book
  book[side].push(order);

  // Sort bids descending, asks ascending
  book.bids.sort((a, b) => b.limitPrice - a.limitPrice);
  book.asks.sort((a, b) => a.limitPrice - b.limitPrice);

  return { matched: false, orderId, status: 'PENDING', message: 'Order queued — waiting for match' };
};

const getOrderBook = (symbol) => {
  const sym = symbol.toUpperCase();
  return orderBook[sym] || null;
};

const cancelOrder = (symbol, orderId, userId) => {
  const sym  = symbol.toUpperCase();
  const book = orderBook[sym];
  if (!book) return false;

  for (const side of ['bids', 'asks']) {
    const idx = book[side].findIndex((o) => o.orderId === orderId && String(o.userId) === String(userId));
    if (idx !== -1) {
      book[side].splice(idx, 1);
      return true;
    }
  }
  return false;
};

module.exports = {
  getStockData,
  getAllStocks,
  searchStocks,
  placeLimitOrder,
  getOrderBook,
  cancelOrder,
  marketEvents,
};
