import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import TradeModal from '../components/TradeModal';
import { Loader2, ListOrdered, Clock, CheckCircle, XCircle, RefreshCw, Trash2, Plus } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const fmtDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_ICON = {
  PENDING:   <Clock className="w-3 h-3" />,
  FILLED:    <CheckCircle className="w-3 h-3" />,
  CANCELLED: <XCircle className="w-3 h-3" />,
};
const STATUS_COLOR = {
  PENDING:   'badge-flat',
  FILLED:    'badge-up',
  CANCELLED: 'badge-down',
};

export default function Orders() {
  const { user, updateBalance } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStock, setModalStock] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch { setError('Failed to load orders.'); }
    finally { setLoading(false); }
  };

  const cancelOrder = async (orderId) => {
    setCancelling(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.map((o) => o.orderId === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (e) {
      alert(e.response?.data?.message || 'Could not cancel order.');
    } finally { setCancelling(null); }
  };

  const openLimitModal = (sym) => {
    setModalStock({ symbol: sym, companyName: sym, price: 0, changePercent: 0 });
    setShowModal(true);
  };

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Order Book</h1>
          <p className="text-sm text-slate-400 mt-1">
            Limit and market order history ·{' '}
            <span className="text-amber-400 font-semibold">{pendingCount} pending</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/8 hover:bg-white/8 text-slate-300 text-xs font-semibold rounded-lg transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => { setModalStock(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition">
            <Plus className="w-3.5 h-3.5" />
            New Order
          </button>
        </div>
      </div>

      {/* Info box about order matching */}
      <div className="card p-4 flex items-start gap-3 border-indigo-500/20">
        <ListOrdered className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <span className="text-white font-semibold">How it works:</span> Limit orders are queued in the order matching engine.
          A BUY limit fills when a pending SELL ask ≤ your bid price. A SELL limit fills when a pending BUY bid ≥ your ask.
          Unmatched orders stay <span className="text-amber-400">PENDING</span> until manually cancelled.
        </div>
      </div>

      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/8 rounded-2xl">
          <ListOrdered className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold text-sm">No orders placed yet</p>
          <p className="text-slate-600 text-xs mt-1">Use the Market page to place trades, or click "New Order" above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0a0d18]/60">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {['Time', 'Order ID', 'Symbol', 'Type', 'Order', 'Qty', 'Limit Price', 'Status', ''].map((h) => (
                  <th key={h} className="py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-white/2 transition">
                  <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                  <td className="py-3.5 px-4 text-[10px] font-mono text-slate-400">{o.orderId}</td>
                  <td className="py-3.5 px-4 font-bold text-white text-xs">{o.symbol}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.type === 'BUY' ? 'badge-up' : 'badge-down'}`}>
                      {o.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-semibold text-slate-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-lg">{o.orderType || 'LIMIT'}</span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-200 font-semibold">{o.quantity}</td>
                  <td className="py-3.5 px-4 text-sm text-slate-200 font-bold">{fmt(o.limitPrice)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${STATUS_COLOR[o.status]}`}>
                      {STATUS_ICON[o.status]} {o.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {o.status === 'PENDING' && (
                      <button onClick={() => cancelOrder(o.orderId)} disabled={cancelling === o.orderId}
                        className="flex items-center gap-1 px-2 py-1 text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold rounded-lg transition">
                        {cancelling === o.orderId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trade modal for new orders */}
      {showModal && user && (
        <TradeModal
          stock={modalStock || { symbol: 'AAPL', companyName: 'Apple Inc.', price: 189.5, changePercent: 0 }}
          currentBalance={user.virtualBalance}
          initialSharesOwned={0}
          onClose={() => { setShowModal(false); setModalStock(null); fetchOrders(); }}
          onTradeSuccess={(newBal) => { updateBalance(newBal); fetchOrders(); }}
        />
      )}
    </div>
  );
}
