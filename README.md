# TradeSim Pro — Stock Trading Simulator

A professional-grade virtual stock trading simulator built with React, Node.js, Express, MongoDB, and WebSockets.

---

## Features

### Core Trading
- **Buy / Sell stocks** — market orders execute instantly at the simulated live price
- **Portfolio tracking** — see quantity, average cost basis, current value, and P&L for every holding
- **Real-time price updates** — WebSocket connection pushes price ticks every 3 seconds

### Advanced
- **Order Matching Engine** — place limit BUY/SELL orders; the engine matches bids against asks automatically
- **Transaction Logs** — full audit trail with order type, quantity, price, total, and realised P&L per trade
- **Market Simulation** — 12 stocks across 6 sectors with realistic mean-reverting price simulation
- **Analytics Dashboard** — realised / unrealised P&L, monthly equity curve, sector allocation pie, win rate

### Tech Concepts
- **Event streams** — market engine emits `trade` and `price_update` events via Node.js EventEmitter
- **WebSocket broadcasting** — server pushes live price ticks to all connected clients
- **Financial data processing** — weighted average cost basis, realised P&L on sell, portfolio summary

---

## Project Structure

```
trading-simulator/
├── .env                        # Environment variables
├── server/
│   ├── server.js               # Entry point — DB + Express + WebSocket all in one file
│   ├── engine/
│   │   └── marketEngine.js     # Price simulation, order book, event bus
│   ├── models/
│   │   ├── User.js
│   │   ├── Portfolio.js
│   │   ├── Transaction.js
│   │   └── LimitOrder.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── tradeController.js
│   │   ├── portfolioController.js
│   │   ├── ordersController.js
│   │   └── analyticsController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stocks.js
│   │   ├── trade.js
│   │   ├── portfolio.js
│   │   ├── orders.js
│   │   └── analytics.js
│   └── middleware/
│       └── authMiddleware.js
└── client/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Market.jsx
    │   │   ├── Portfolio.jsx
    │   │   ├── Orders.jsx
    │   │   ├── Analytics.jsx
    │   │   └── History.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── StockCard.jsx
    │   │   ├── StockChart.jsx
    │   │   ├── TradeModal.jsx
    │   │   └── PortfolioTable.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── WsContext.jsx
    │   └── utils/
    │       └── api.js
    └── package.json
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### 1. Configure environment
```bash
# Edit .env at the root with your MongoDB URI and JWT secret
```

### 2. Install server dependencies
```bash
cd server
npm install
```

### 3. Install client dependencies
```bash
cd client
npm install
```

### 4. Start the server
```bash
cd server
npm run dev      # development (nodemon)
# or
npm start        # production
```

### 5. Start the client
```bash
cd client
npm run dev
```

Open **http://localhost:5173** — the frontend proxies `/api` requests to the server on port 5000.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET | `/api/stocks/search?q=` | Search/list stocks |
| GET | `/api/stocks/:symbol` | Single stock details |
| POST | `/api/trade/buy` | Market buy order |
| POST | `/api/trade/sell` | Market sell order |
| GET | `/api/portfolio` | Portfolio with live P&L |
| GET | `/api/portfolio/history` | Transaction log |
| POST | `/api/orders/limit` | Place limit order |
| GET | `/api/orders` | My orders |
| DELETE | `/api/orders/:orderId` | Cancel limit order |
| GET | `/api/orders/book/:symbol` | Order book for symbol |
| GET | `/api/analytics/summary` | Full analytics summary |

### WebSocket
Connect to `ws://localhost:5000` — receives:
- `MARKET_SNAPSHOT` on connect (all stocks)
- `PRICE_TICK` every 3 seconds (all stocks)

---

## Default Account
Each registered account starts with **$10,000** in virtual cash.
