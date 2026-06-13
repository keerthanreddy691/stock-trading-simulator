import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Award,
  PieChart as PieIcon, BarChart2, Loader2, RefreshCw
} from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const SECTOR_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className={`font-bold ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{val >= 0 ? '+' : ''}{fmt(val)}</p>
    </div>
  );
};

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/analytics/summary');
      setData(res.data);
    } catch { setError('Failed to load analytics data.'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center py-32 gap-3">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      <p className="text-slate-500 text-sm">Crunching your numbers…</p>
    </div>
  );

  if (error) return (
    <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>
  );

  const { realisedPL, unrealisedPL, totalPL, totalTrades, winRate, winningTrades, losingTrades,
          sectorAllocation, equityCurve, topAssets } = data;

  const plColor = (v) => v >= 0 ? 'text-emerald-400' : 'text-rose-400';

  const kpis = [
    { label: 'Total P&L', value: `${totalPL >= 0 ? '+' : ''}${fmt(totalPL)}`, color: plColor(totalPL), icon: totalPL >= 0 ? TrendingUp : TrendingDown, bg: totalPL >= 0 ? 'bg-emerald-500/10 border-emerald-500/15' : 'bg-rose-500/10 border-rose-500/15' },
    { label: 'Realised P&L', value: `${realisedPL >= 0 ? '+' : ''}${fmt(realisedPL)}`, color: plColor(realisedPL), icon: Target, bg: 'bg-blue-500/10 border-blue-500/15' },
    { label: 'Unrealised P&L', value: `${unrealisedPL >= 0 ? '+' : ''}${fmt(unrealisedPL)}`, color: plColor(unrealisedPL), icon: BarChart2, bg: 'bg-purple-500/10 border-purple-500/15' },
    { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'text-emerald-400' : 'text-amber-400', icon: Award, bg: 'bg-amber-500/10 border-amber-500/15' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            {totalTrades} total trades · {winningTrades} wins · {losingTrades} losses
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/8 hover:bg-white/8 text-slate-300 text-xs font-semibold rounded-lg transition">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, icon: Icon, bg }) => (
          <div key={label} className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Win/Loss Bar + Sector Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly P&L Chart */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" /> Monthly Realised P&L
          </h2>
          {equityCurve.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-white/8 rounded-xl">
              No closed trades yet. Sell some positions to see monthly P&L.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={equityCurve} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={55} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                  {equityCurve.map((e, i) => (
                    <Cell key={i} fill={e.pl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sector Allocation Pie */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-400" /> Sector Allocation
          </h2>
          {sectorAllocation.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-white/8 rounded-xl">
              No holdings yet. Buy stocks to see your sector breakdown.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sectorAllocation} dataKey="value" nameKey="sector" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2}>
                  {sectorAllocation.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Assets + Win/Loss Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Assets */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Top Performing Assets</h2>
          {topAssets.length === 0 ? (
            <p className="text-slate-500 text-xs py-8 text-center border border-dashed border-white/8 rounded-xl">No closed trades yet.</p>
          ) : (
            <div className="space-y-2">
              {topAssets.map((a, i) => (
                <div key={a.symbol} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{a.symbol}</p>
                      <p className="text-[10px] text-slate-500">{a.trades} trade{a.trades !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-black ${plColor(a.realisedPL)}`}>
                    {a.realisedPL >= 0 ? '+' : ''}{fmt(a.realisedPL)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Win / Loss Summary */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Trade Outcome Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Trades', value: totalTrades, color: 'text-white', bar: 100, barColor: 'bg-indigo-500' },
              { label: 'Winning Trades', value: winningTrades, color: 'text-emerald-400', bar: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0, barColor: 'bg-emerald-500' },
              { label: 'Losing Trades', value: losingTrades, color: 'text-rose-400', bar: totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0, barColor: 'bg-rose-500' },
            ].map(({ label, value, color, bar, barColor }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${bar}%`, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Win Rate</p>
            <p className={`text-3xl font-black mt-1 ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{winRate}%</p>
            <p className="text-[10px] text-slate-500 mt-1">
              {winRate >= 60 ? 'Excellent performance' : winRate >= 40 ? 'Decent — keep refining your strategy' : 'Review your trade timing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
