import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { useMarketStream } from '../context/WsContext';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const StockCard = ({ stock, onTradeClick }) => {
  const { prices }   = useMarketStream();
  const live         = prices[stock.symbol];
  const price        = live?.price        ?? stock.price;
  const changePercent = live?.changePercent ?? stock.changePercent;
  const isUp         = changePercent >= 0;

  // Flash effect on price change
  const [flashClass, setFlashClass] = useState('');
  const prevPrice = useRef(price);
  useEffect(() => {
    if (prevPrice.current !== price) {
      setFlashClass(price > prevPrice.current ? 'flash-green' : 'flash-red');
      const t = setTimeout(() => setFlashClass(''), 700);
      prevPrice.current = price;
      return () => clearTimeout(t);
    }
  }, [price]);

  return (
    <div className="card card-hover p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded-md">
            {stock.symbol}
          </span>
          <p className="text-sm font-semibold text-white mt-2 leading-snug">{stock.companyName}</p>
          {stock.sector && <p className="text-[10px] text-slate-500 mt-0.5">{stock.sector}</p>}
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
          isUp ? 'badge-up' : 'badge-down'
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="flex items-end justify-between">
        <span className={`text-2xl font-black text-white ${flashClass}`}>
          {fmt(price)}
        </span>
        <button
          onClick={() => onTradeClick({ ...stock, price, changePercent })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-indigo-500/20"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Trade
        </button>
      </div>
    </div>
  );
};

export default StockCard;
