import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, Zap, Clock } from 'lucide-react';
import api from '../utils/api';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const TradeModal = ({ stock, currentBalance, initialSharesOwned = 0, onClose, onTradeSuccess }) => {
  const [tab,        setTab]        = useState('BUY');
  const [orderType,  setOrderType]  = useState('MARKET');
  const [quantity,   setQuantity]   = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock.price.toFixed(2));
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const execPrice    = orderType === 'LIMIT' ? parseFloat(limitPrice) : stock.price;
  const totalCost    = parseFloat((execPrice * quantity).toFixed(2));
  const maxBuyable   = Math.floor(currentBalance / stock.price);
  const canBuy       = tab === 'BUY' && totalCost <= currentBalance && quantity > 0;
  const canSell      = tab === 'SELL' && quantity <= initialSharesOwned && quantity > 0;

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      let res;
      if (orderType === 'MARKET') {
        res = await api.post(`/trade/${tab.toLowerCase()}`, { symbol: stock.symbol, quantity: parseInt(quantity) });
        setSuccess(res.data.message);
        onTradeSuccess(res.data.virtualBalance, res.data.portfolio);
      } else {
        res = await api.post('/orders/limit', {
          symbol: stock.symbol, type: tab, quantity: parseInt(quantity),
          limitPrice: parseFloat(limitPrice),
        });
        setSuccess(res.data.message);
        if (res.data.virtualBalance) onTradeSuccess(res.data.virtualBalance, res.data.portfolio);
      }
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isUp = stock.changePercent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md card p-6 space-y-5" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">{stock.symbol}</span>
              <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${isUp ? 'badge-up' : 'badge-down'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{stock.companyName} · {fmt(stock.price)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BUY / SELL tabs */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {['BUY', 'SELL'].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                tab === t
                  ? t === 'BUY' ? 'bg-emerald-600 text-white shadow' : 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Order Type */}
        <div className="flex gap-2">
          {[['MARKET', Zap, 'Execute now at market price'], ['LIMIT', Clock, 'Set a specific target price']].map(([type, Icon, desc]) => (
            <button key={type} onClick={() => setOrderType(type)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition ${
                orderType === type
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                  : 'border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{type}</span>
              <span className="text-[9px] text-center font-normal leading-tight opacity-70">{desc}</span>
            </button>
          ))}
        </div>

        {/* Limit price input */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Limit Price ($)</label>
            <input type="number" step="0.01" min="0.01" value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>
        )}

        {/* Quantity */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quantity</label>
            {tab === 'BUY' && (
              <span className="text-[10px] text-slate-500">Max: <span className="text-white font-bold">{maxBuyable}</span> shares</span>
            )}
            {tab === 'SELL' && (
              <span className="text-[10px] text-slate-500">Owned: <span className="text-white font-bold">{initialSharesOwned}</span></span>
            )}
          </div>
          <div className="flex gap-2">
            <input type="number" min="1" value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 transition"
            />
            {[1, 5, 10, 25].map((q) => (
              <button key={q} onClick={() => setQuantity(q)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                  quantity === q ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'border-white/10 text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-900/40 rounded-xl p-3 space-y-1.5 border border-white/5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Order type</span>
            <span className="font-semibold text-white">{orderType}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Est. total</span>
            <span className="font-bold text-white">{fmt(totalCost)}</span>
          </div>
          {tab === 'BUY' && (
            <div className="flex justify-between text-slate-400">
              <span>Balance after</span>
              <span className={`font-bold ${currentBalance - totalCost >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {fmt(currentBalance - totalCost)}
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        {error   && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{success}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || (tab === 'BUY' ? !canBuy : !canSell)}
          className={`w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 ${
            tab === 'BUY'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/20'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Processing...' : `${tab} ${quantity} × ${stock.symbol}`}
        </button>
      </div>
    </div>
  );
};

export default TradeModal;
