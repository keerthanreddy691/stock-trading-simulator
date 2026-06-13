import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, Zap, BarChart2, ShieldCheck,
  ArrowRight, Globe, Layers, Activity
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/15',
    title: 'Real-time Price Simulation',
    desc: 'Prices update live every 3 seconds over WebSocket — just like a real trading terminal.',
  },
  {
    icon: Layers,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/15',
    title: 'Order Matching Engine',
    desc: 'Place market or limit orders. The engine matches bids and asks automatically when conditions are met.',
  },
  {
    icon: BarChart2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/15',
    title: 'Profit & Loss Analytics',
    desc: 'Realised and unrealised P&L, win rate, equity curve, sector breakdown — all in one analytics dashboard.',
  },
  {
    icon: Activity,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/15',
    title: 'Transaction Log',
    desc: 'Every buy, sell, and limit fill is recorded in a filterable audit log with timestamp and P&L per trade.',
  },
  {
    icon: Globe,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/15',
    title: 'Multi-sector Market',
    desc: '12 stocks across Technology, Finance, Healthcare, Retail, and more — simulate a diversified portfolio.',
  },
  {
    icon: ShieldCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/15',
    title: 'Zero Real Risk',
    desc: 'Every account starts with $10,000 in virtual cash. Practice freely — no real money involved.',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col">
      {/* Background glows */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-900/8 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08090f]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow shadow-indigo-500/30">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">TradeSim Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition">Sign In</Link>
                <Link to="/register"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow shadow-indigo-500/20">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-grow flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold rounded-full mb-6">
          <Activity className="w-3 h-3" />
          Live WebSocket market · Order matching engine · Full P&L analytics
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-none max-w-4xl">
          Trade Smarter.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Risk Nothing.
          </span>
        </h1>

        <p className="mt-6 text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
          A professional-grade stock trading simulator with live price streams, a real order-matching engine,
          and full portfolio analytics — built for finance learners and developers alike.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link to="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/15 transition">
              Open Trading Desk <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/register"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/15 transition">
                Start Trading Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login"
                className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition">
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          {[['12', 'Stocks'], ['$10,000', 'Starting Cash'], ['Live', 'Price Feed']].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-black text-white">{val}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl w-full mx-auto px-6 pb-24">
        <h2 className="text-2xl font-black text-white text-center mb-10">Everything a real trading desk needs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="card card-hover p-6 space-y-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-bold text-white">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-6 text-center text-[11px] text-slate-600">
        © {new Date().getFullYear()} TradeSim Pro &mdash; For educational purposes only. No real funds at risk.
      </footer>
    </div>
  );
}
