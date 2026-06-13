/**
 * Trading Simulator — Main Server
 * Handles DB connection, REST API, and WebSocket price streaming in one place.
 */

const express        = require('express');
const cors           = require('cors');
const path           = require('path');
const http           = require('http');
const { WebSocketServer } = require('ws');
const mongoose       = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

// ─── Database Connection ────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trading-simulator'
    );
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

connectDB();

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://stock-trading-simulator-bs6u.onrender.com'],
  credentials: true,
}));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/stocks',    require('./routes/stocks'));
app.use('/api/trade',     require('./routes/trade'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));

// ─── WebSocket — Real-time Price Stream ─────────────────────────────────────
const { getStockData, getAllStocks } = require('./engine/marketEngine');

wss.on('connection', (ws) => {
  console.log('📡 Client connected to live market stream');

  // Send full market snapshot immediately on connect
  const snapshot = getAllStocks();
  ws.send(JSON.stringify({ type: 'MARKET_SNAPSHOT', data: snapshot }));

  // Keep connection alive
  const ping = setInterval(() => {
    if (ws.readyState === ws.OPEN) ws.ping();
  }, 25000);

  ws.on('close', () => {
    clearInterval(ping);
    console.log('📡 Client disconnected');
  });
});

// Broadcast live price ticks every 3 seconds to all connected clients
setInterval(() => {
  if (wss.clients.size === 0) return;
  const tick = getAllStocks(); // triggers price fluctuation
  const msg  = JSON.stringify({ type: 'PRICE_TICK', data: tick });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(msg);
  });
}, 3000);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
