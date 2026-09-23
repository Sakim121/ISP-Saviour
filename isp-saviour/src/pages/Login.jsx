import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Network, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/dashboard/map';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Network size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">ISP SAVIOUR</p>
            <p className="text-[11px] text-slate-400">Technician Sign In</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Viewing the map and dashboard doesn't require an account — sign in
          only if you need to draw or edit network data.{' '}
          <br />
          No account? Ask an admin to create one — see{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5">supabase/DEPLOYMENT.md</code>.
        </p>
      </div>
    </div>
  );
}
