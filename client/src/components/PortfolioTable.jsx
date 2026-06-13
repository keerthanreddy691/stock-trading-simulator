import React from 'react';
import { TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';

const fmt  = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function PortfolioTable({ stocks, onTradeClick }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0a0d18]/60 backdrop-blur-md">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-white/2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {['Asset', 'Shares', 'Avg Buy', 'Current Price', 'Mkt Value', 'P&L', 'P&L %', ''].map((h) => (
              <th key={h} className={`py-3 px-4 ${h === '' || h === 'P&L' || h === 'P&L %' || h === 'Mkt Value' || h === 'Current Price' ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/3">
          {stocks.map((s) => {
            const up = s.pl >= 0;
            return (
              <tr key={s.symbol} className="hover:bg-white/2 transition">
                <td className="py-3.5 px-4">
                  <p className="font-bold text-white text-xs">{s.symbol}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{s.companyName}</p>
                  {s.sector && <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">{s.sector}</span>}
                </td>
                <td className="py-3.5 px-4 text-sm font-semibold text-slate-200">{s.quantity}</td>
                <td className="py-3.5 px-4 text-sm text-slate-300">{fmt(s.avgBuyPrice)}</td>
                <td className="py-3.5 px-4 text-right">
                  <span className="text-sm font-bold text-white">{fmt(s.currentPrice)}</span>
                  <span className={`ml-1.5 text-[10px] font-semibold ${s.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.changePercent >= 0 ? '▲' : '▼'}{Math.abs(s.changePercent).toFixed(2)}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right text-sm font-semibold text-slate-200">{fmt(s.currentValue)}</td>
                <td className={`py-3.5 px-4 text-right text-sm font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {up ? '+' : ''}{fmt(s.pl)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${up ? 'badge-up' : 'badge-down'}`}>
                    {up ? <TrendingUp className="inline w-3 h-3 mr-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-0.5" />}
                    {up ? '+' : ''}{s.plPercent.toFixed(2)}%
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <button onClick={() => onTradeClick(s)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition">
                    <ShoppingCart className="w-3 h-3" /> Trade
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
