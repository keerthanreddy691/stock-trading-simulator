import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarketStream } from '../context/WsContext';
import {
  TrendingUp, LayoutDashboard, Landmark, Briefcase,
  History, LogOut, Wallet, Activity, BarChart2, ListOrdered
} from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const Navbar = () => {
  const { user, logout }    = useAuth();
  const { prices, connected } = useMarketStream();
  const location            = useLocation();
  const navigate            = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard },
    { name: 'Market',     path: '/market',     icon: Landmark },
    { name: 'Portfolio',  path: '/portfolio',  icon: Briefcase },
    { name: 'Orders',     path: '/orders',     icon: ListOrdered },
    { name: 'Analytics',  path: '/analytics',  icon: BarChart2 },
    { name: 'History',    path: '/history',    icon: History },
  ];

  const tickerSymbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'NVDA', 'META', 'AMZN', 'NFLX'];

  return (
    <nav className="sticky top-0 z-50 bg-[#08090f]/90 backdrop-blur-md border-b border-white/5">
      {/* ── Live Ticker Tape ─────────────────────────────────── */}
      <div className="overflow-hidden bg-slate-900/40 border-b border-white/5 py-1 text-[11px] font-medium">
        <div className="ticker-inner">
          {[...tickerSymbols, ...tickerSymbols].map((sym, i) => {
            const d = prices[sym];
            const up = d?.changePercent >= 0;
            return (
              <span key={i} className="mx-5 flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">{sym}</span>
                {d ? (
                  <>
                    <span className="text-white font-bold">${d.price.toFixed(2)}</span>
                    <span className={up ? 'text-emerald-400' : 'text-rose-400'}>
                      {up ? '▲' : '▼'} {Math.abs(d.changePercent).toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Main Nav Bar ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow shadow-indigo-500/30">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white hidden sm:block">TradeSim Pro</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ name, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link key={name} to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {name}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 text-[10px] font-semibold ${connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              <Activity className="w-3 h-3" />
              {connected ? 'LIVE' : 'OFFLINE'}
            </div>

            {/* Balance */}
            {user && (
              <div className="flex items-center gap-1.5 bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-2.5 py-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">{fmt(user.virtualBalance)}</span>
              </div>
            )}

            {/* User + logout */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="hidden lg:block text-xs font-semibold text-slate-300">{user.name}</span>
                <button onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden justify-around py-2 border-t border-white/5">
          {navItems.map(({ name, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={name} to={path}
                className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition gap-0.5 ${
                  active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
