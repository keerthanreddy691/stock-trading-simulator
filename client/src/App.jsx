import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WsProvider } from './context/WsContext';
import Navbar from './components/Navbar';
import Home      from './pages/Home';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Market    from './pages/Market';
import Portfolio from './pages/Portfolio';
import Orders    from './pages/Orders';
import Analytics from './pages/Analytics';
import History   from './pages/History';
import { Loader2 } from 'lucide-react';

const Spinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090f]">
    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    <p className="text-slate-500 text-xs mt-3 font-medium">Connecting to market…</p>
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return (
    <WsProvider>
      <div className="flex flex-col min-h-screen bg-[#07090f] text-slate-100">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
        <footer className="border-t border-white/5 py-5 text-center text-[11px] text-slate-600 bg-[#06080e]">
          © {new Date().getFullYear()} TradeSim Pro &mdash; Virtual trading only. No real money at risk.
        </footer>
      </div>
    </WsProvider>
  );
};

const PublicRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const Fallback = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return <Navigate to={user ? '/dashboard' : '/'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route element={<PublicRoute />}>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market"    element={<Market />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/orders"    element={<Orders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history"   element={<History />} />
          </Route>

          <Route path="*" element={<Fallback />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
