'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">Forgot password</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
          Enter your email and we&apos;ll send reset instructions (email integration can be added later).
        </p>
        {sent ? (
          <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-center">
            If an account exists for that email, you will receive reset instructions.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="mt-4 text-center">
          <Link href="/login" className="text-sky-600 dark:text-sky-400 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
