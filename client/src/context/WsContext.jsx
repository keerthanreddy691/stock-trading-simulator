import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const WsContext = createContext(null);

export const WsProvider = ({ children }) => {
  const [prices, setPrices]   = useState({});   // { AAPL: { price, change, changePercent } }
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://localhost:5000`);
    wsRef.current = ws;

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => { setConnected(false); setTimeout(connect, 4000); };
    ws.onerror = () => ws.close();

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'MARKET_SNAPSHOT' || msg.type === 'PRICE_TICK') {
          const update = {};
          msg.data.forEach((stock) => {
            update[stock.symbol] = {
              price:         stock.price,
              change:        stock.change,
              changePercent: stock.changePercent,
            };
          });
          setPrices((prev) => ({ ...prev, ...update }));
        }
      } catch { /* ignore parse errors */ }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return (
    <WsContext.Provider value={{ prices, connected }}>
      {children}
    </WsContext.Provider>
  );
};

export const useMarketStream = () => useContext(WsContext);
