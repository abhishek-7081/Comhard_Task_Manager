import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
          T
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-main">
          TaskFlow Pro
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Production MERN Task Management & SLA Workflow Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-edge sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 active:scale-95 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Instant Review */}
          <div className="mt-6 pt-6 border-t border-edge">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-ocean-600" />
              <span>One-Click Demo Accounts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@example.com', 'password123')}
                className="p-2 text-xs font-semibold rounded-lg bg-forest-50 text-forest-700 border border-forest-200 hover:bg-forest-100 transition text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('member@example.com', 'password123')}
                className="p-2 text-xs font-semibold rounded-lg bg-ocean-50 text-ocean-700 border border-ocean-200 hover:bg-ocean-100 transition text-center"
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('viewer@example.com', 'password123')}
                className="p-2 text-xs font-semibold rounded-lg bg-earth-50 text-earth-700 border border-earth-200 hover:bg-earth-100 transition text-center"
              >
                Viewer
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-ink-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-forest-700 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
