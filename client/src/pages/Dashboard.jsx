import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarketStream } from '../context/WsContext';
import api from '../utils/api';
import StockChart from '../components/StockChart';
import {
  Wallet, TrendingUp, TrendingDown, Layers, Briefcase,
  LineChart, ArrowUpRight, Loader2, Activity
} from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export default function Dashboard() {
  const { user }         = useAuth();
  const { prices }       = useMarketStream();
  const [summary, setSummary]   = useState({ totalInvested: 0, currentValue: 0, totalPL: 0, totalPLPercent: 0 });
  const [holdings, setHoldings] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [portRes, stockRes] = await Promise.all([
          api.get('/portfolio'),
          api.get('/stocks/AAPL'),
        ]);
        setSummary(portRes.data.summary);
        setHoldings(portRes.data.stocks || []);
        setFeatured(stockRes.data);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isProfit = summary.totalPL >= 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      <p className="text-slate-500 text-sm mt-3">Loading your dashboard…</p>
    </div>
  );

  const liveAapl   = prices['AAPL'];
  const aaplPrice  = liveAapl?.price ?? featured?.price ?? 0;
  const aaplChange = liveAapl?.changePercent ?? featured?.changePercent ?? 0;

  const statCards = [
    {
      label: 'Virtual Cash',
      value: fmt(user?.virtualBalance || 0),
      sub: 'Available to trade',
      icon: Wallet,
      color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/15',
    },
    {
      label: 'Capital Invested',
      value: fmt(summary.totalInvested),
      sub: `${holdings.length} position${holdings.length !== 1 ? 's' : ''}`,
      icon: Layers,
      color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15',
    },
    {
      label: 'Portfolio Value',
      value: fmt(summary.currentValue),
      sub: 'Current market price',
      icon: Briefcase,
      color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/15',
    },
    {
      label: 'Total Returns',
      value: `${isProfit ? '+' : ''}${fmt(summary.totalPL)}`,
      sub: `${isProfit ? '+' : ''}${summary.totalPLPercent.toFixed(2)}%`,
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'text-emerald-400' : 'text-rose-400',
      bg:    isProfit ? 'bg-emerald-500/10 border-emerald-500/15' : 'bg-rose-500/10 border-rose-500/15',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">Here's what your portfolio looks like right now.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
          <div className="live-dot" />
          LIVE MARKET
        </div>
      </div>

      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{label}</span>
              <span className={`text-xl font-black block ${color}`}>{value}</span>
              <span className="text-[11px] text-slate-500 block">{sub}</span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AAPL Chart */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">Apple Inc. (AAPL)</span>
            </div>
            {liveAapl && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${aaplChange >= 0 ? 'badge-up' : 'badge-down'}`}>
                ${aaplPrice.toFixed(2)} · {aaplChange >= 0 ? '+' : ''}{aaplChange.toFixed(2)}%
              </span>
            )}
          </div>
          {featured && (
            <StockChart
              data={featured.history}
              color={aaplChange >= 0 ? '#10b981' : '#ef4444'}
              height={200}
            />
          )}
        </div>

        {/* Top Holdings */}
        <div className="card p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-white">Your Holdings</h2>
          {holdings.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-3 py-10 border border-dashed border-white/8 rounded-xl">
              <p className="text-slate-500 text-xs text-center">No positions yet.</p>
              <Link to="/market"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">
                Buy First Stock
              </Link>
            </div>
          ) : (
            <div className="space-y-2 flex-grow">
              {holdings.slice(0, 5).map((s) => (
                <div key={s.symbol} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">{s.symbol}</p>
                    <p className="text-[10px] text-slate-500">{s.quantity} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{fmt(s.currentValue)}</p>
                    <p className={`text-[10px] font-bold ${s.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.pl >= 0 ? '+' : ''}{s.plPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
              {holdings.length > 5 && (
                <p className="text-[10px] text-slate-600 text-center">+{holdings.length - 5} more positions</p>
              )}
            </div>
          )}
          {holdings.length > 0 && (
            <Link to="/portfolio"
              className="flex items-center justify-center gap-1 w-full py-2 bg-white/5 border border-white/8 hover:bg-white/8 text-slate-300 text-xs font-bold rounded-xl transition">
              View Full Portfolio <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Browse Market', to: '/market', color: 'from-indigo-600 to-blue-600' },
          { label: 'My Portfolio', to: '/portfolio', color: 'from-purple-600 to-indigo-600' },
          { label: 'Analytics', to: '/analytics', color: 'from-blue-600 to-cyan-600' },
          { label: 'Trade History', to: '/history', color: 'from-slate-700 to-slate-600' },
        ].map(({ label, to, color }) => (
          <Link key={to} to={to}
            className={`flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${color} text-white text-xs font-bold rounded-xl transition hover:opacity-90`}>
            {label} <ArrowUpRight className="w-3 h-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}
