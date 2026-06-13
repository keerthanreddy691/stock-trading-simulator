import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StockCard from '../components/StockCard';
import TradeModal from '../components/TradeModal';
import { Search, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react';

const SECTORS = ['All', 'Technology', 'Finance', 'Automotive', 'E-Commerce', 'Semiconductors', 'Social Media', 'Entertainment', 'Healthcare', 'Retail'];

export default function Market() {
  const { user, updateBalance } = useAuth();
  const [stocks, setStocks]           = useState([]);
  const [portfolioStocks, setPortfolioStocks] = useState([]);
  const [search, setSearch]           = useState('');
  const [sector, setSector]           = useState('All');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [selected, setSelected]       = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const [stocksRes, portRes] = await Promise.all([
        api.get('/stocks/search'),
        api.get('/portfolio'),
      ]);
      setStocks(stocksRes.data);
      setPortfolioStocks(portRes.data.stocks || []);
    } catch {
      setError('Could not fetch market data. Please try again.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const onTradeSuccess = (newBal, updatedPort) => {
    updateBalance(newBal);
    setPortfolioStocks(updatedPort || []);
    fetchAll(true);
  };

  const sharesOwned = (sym) => {
    const s = portfolioStocks.find((p) => p.symbol === sym.toUpperCase());
    return s ? s.quantity : 0;
  };

  const filtered = stocks
    .filter((s) => {
      const q = search.toLowerCase();
      return s.symbol.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q);
    })
    .filter((s) => sector === 'All' || s.sector === sector);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Stock Market</h1>
          <p className="text-sm text-slate-400 mt-1">Live prices · 12 equities · Prices update every 3s</p>
        </div>
        <button onClick={() => fetchAll(true)} disabled={refreshing || loading}
          className="flex items-center gap-1.5 self-start px-3 py-1.5 bg-white/5 border border-white/8 hover:bg-white/8 text-slate-300 text-xs font-semibold rounded-lg transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Search + Sector filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or company…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-white/8 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {SECTORS.map((s) => (
            <button key={s} onClick={() => setSector(s)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                sector === s
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'border-white/8 text-slate-500 hover:text-white hover:bg-white/5'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading market data…</p>
        </div>
      ) : error ? (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/8 rounded-2xl">
          <p className="text-slate-500 text-sm">No stocks match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} onTradeClick={setSelected} />
          ))}
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
