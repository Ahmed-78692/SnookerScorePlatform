'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface LoginFormProps {
  onAuthenticated: (displayName: string) => void;
}

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const res = await api.register(email, password, displayName || email.split('@')[0], 'Scorer');
        onAuthenticated(res.displayName);
      } else {
        const res = await api.login(email, password);
        onAuthenticated(res.displayName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick start for development — register with minimal info
  const handleQuickStart = async () => {
    setLoading(true);
    setError('');
    try {
      const quickEmail = `scorer_${Date.now()}@snooker.local`;
      const quickName = displayName || 'Match Scorer';
      const res = await api.register(quickEmail, 'Scorer123!', quickName, 'Scorer');
      onAuthenticated(res.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quick start failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">🎱 Snooker Scorer</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Sign in to start scoring</p>

        {/* Quick Start */}
        <div className="mb-6">
          <div className="flex gap-2 items-end mb-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ahmed"
              />
            </div>
            <button
              onClick={handleQuickStart}
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded-lg font-semibold text-sm whitespace-nowrap transition"
            >
              {loading ? '...' : 'Quick Start →'}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 text-center">No account needed — just enter your name</p>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">or sign in</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Full Login/Register */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            placeholder="Password"
            required
          />

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg font-semibold text-sm transition"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account & Score'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full mt-3 text-xs text-gray-500 hover:text-gray-300 text-center py-2"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
