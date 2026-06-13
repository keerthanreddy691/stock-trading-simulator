import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader2, Calendar, Filter, ArrowDownLeft, ArrowUpRight, Ban } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter]   = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => { fetchHistory(); }, [filter]);

  const fetchHistory = async () => {
    setLoading(true); setError('');
    try {
      const param = filter === 'ALL' ? '' : `?type=${filter}`;
      const res   = await api.get(`/portfolio/history${param}`);
      setTransactions(res.data);
    } catch { setError('Failed to load transaction history.'); }
    finally { setLoading(false); }
  };

  const totalRealised = transactions
    .filter((t) => t.type === 'SELL')
    .reduce((sum, t) => sum + (t.realisedPL || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Trading History</h1>
        <p className="text-sm text-slate-400 mt-1">Complete audit log of every buy and sell order</p>
      </div>

      {/* Filter + Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 card p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filter</span>
          <div className="flex gap-1 ml-1">
            {['ALL', 'BUY', 'SELL'].map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  filter === t
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-500 hover:text-white border border-transparent'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {filter !== 'BUY' && (
          <div className="text-xs text-slate-400">
            Realised P&L from shown sells:{' '}
            <span className={`font-bold ${totalRealised >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalRealised >= 0 ? '+' : ''}{fmt(totalRealised)}
            </span>
          </div>
        )}
      </div>

      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading ledger…</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/8 rounded-2xl flex flex-col items-center gap-3">
          <Ban className="w-7 h-7 text-slate-600" />
          <p className="text-slate-400 text-sm font-semibold">No transactions found</p>
          <p className="text-slate-600 text-xs">
            {filter !== 'ALL' ? `No ${filter} transactions recorded yet.` : 'Make your first trade to see it here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0a0d18]/60">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {['Time', 'Asset', 'Type', 'Order', 'Qty', 'Price', 'Total', 'Realised P&L'].map((h) => (
                  <th key={h} className={`py-3 px-4 ${['Total', 'Realised P&L', 'Price'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {transactions.map((tx) => {
                const isBuy = tx.type === 'BUY';
                const hasPL = tx.realisedPL != null && tx.realisedPL !== 0;
                return (
                  <tr key={tx._id} className="hover:bg-white/2 transition">
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        {fmtDate(tx.timestamp)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-xs">{tx.symbol}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{tx.companyName}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`flex items-center gap-1 w-fit text-[10px] font-bold px-2 py-0.5 rounded-full border ${isBuy ? 'badge-up' : 'badge-down'}`}>
                        {isBuy ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] text-slate-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-lg font-semibold">
                        {tx.orderType || 'MARKET'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-slate-200">{tx.quantity}</td>
                    <td className="py-3.5 px-4 text-right text-sm text-slate-300">{fmt(tx.priceAtTransaction)}</td>
                    <td className="py-3.5 px-4 text-right text-sm font-bold text-white">{fmt(tx.totalAmount)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {hasPL ? (
                        <span className={`text-sm font-bold ${tx.realisedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.realisedPL >= 0 ? '+' : ''}{fmt(tx.realisedPL)}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
