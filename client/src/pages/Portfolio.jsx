import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PortfolioTable from '../components/PortfolioTable';
import TradeModal from '../components/TradeModal';
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function Portfolio() {
  const { user, updateBalance } = useAuth();
  const [stocks, setStocks]     = useState([]);
  const [summary, setSummary]   = useState({ totalInvested: 0, currentValue: 0, totalPL: 0, totalPLPercent: 0 });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchPortfolio(); }, []);

  const fetchPortfolio = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const res = await api.get('/portfolio');
      setStocks(res.data.stocks || []);
      setSummary(res.data.summary);
    } catch { setError('Failed to load portfolio.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onTradeSuccess = (newBal, updatedPort) => {
    updateBalance(newBal);
    setStocks(updatedPort || []);
    fetchPortfolio(true);
  };

  const sharesOwned = (sym) => {
    const s = stocks.find((p) => p.symbol === sym.toUpperCase());
    return s ? s.quantity : 0;
  };

  const isProfit = summary.totalPL >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Investment Portfolio</h1>
          <p className="text-sm text-slate-400 mt-1">Asset allocation, cost basis, and live P&L</p>
        </div>
        <button onClick={() => fetchPortfolio(true)} disabled={loading || refreshing}
          className="flex items-center gap-1.5 self-start px-3 py-1.5 bg-white/5 border border-white/8 hover:bg-white/8 text-slate-300 text-xs font-semibold rounded-lg transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading portfolio…</p>
        </div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-white/8 rounded-2xl flex flex-col items-center gap-4">
          <AlertCircle className="w-8 h-8 text-slate-600" />
          <div>
            <h3 className="font-bold text-slate-300">No Positions Held</h3>
            <p className="text-slate-500 text-xs mt-1">Your portfolio is empty. Head to Market to buy your first stock.</p>
          </div>
          <Link to="/market"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition">
            Go to Market
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="card p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Invested', value: fmt(summary.totalInvested), color: 'text-white' },
              { label: 'Current Value', value: fmt(summary.currentValue), color: 'text-white' },
              {
                label: 'Total P&L',
                value: `${isProfit ? '+' : ''}${fmt(summary.totalPL)}`,
                color: isProfit ? 'text-emerald-400' : 'text-rose-400',
              },
              {
                label: 'Return %',
                value: `${isProfit ? '+' : ''}${summary.totalPLPercent.toFixed(2)}%`,
                color: isProfit ? 'text-emerald-400' : 'text-rose-400',
                extra: isProfit
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-rose-400" />,
              },
            ].map(({ label, value, color, extra }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {extra}
                  <p className={`text-lg font-black ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Holdings Table */}
          <PortfolioTable stocks={stocks} onTradeClick={setSelected} />
        </div>
      )}

      {selected && user && (
        <TradeModal
          stock={selected}
          currentBalance={user.virtualBalance}
          initialSharesOwned={sharesOwned(selected.symbol)}
          onClose={() => setSelected(null)}
          onTradeSuccess={onTradeSuccess}
        />
      )}
    </div>
  );
}
