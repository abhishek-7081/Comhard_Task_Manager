import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowRight, Loader2 } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, role);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-forest-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
          T
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-main">
          Create an Account
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Get started with your personal workspace and standard sections
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-edge sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Email Address *
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
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                System Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              >
                <option value="Admin">Admin (Full workspace control)</option>
                <option value="Member">Member (Create and manage tasks)</option>
                <option value="Viewer">Viewer (Read-only access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 active:scale-95 shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-ink-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-forest-700 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
