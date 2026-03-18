'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { users } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setCurrency(user.currency || 'PKR');
      if (user.theme) setTheme(user.theme as 'light' | 'dark');
    }
  }, [user, setTheme]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const data: { name?: string; email?: string; password?: string; currency?: string; theme?: string } = { name: name.trim(), email: email.trim(), currency, theme };
      if (password.length >= 6) data.password = password;
      await users.update(data);
      setMessage('Profile updated.');
      setPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    try {
      await users.deleteAccount();
      logout();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {message && (
            <p className={`text-sm ${message === 'Profile updated.' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {message}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New password (leave blank to keep)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Currency</h2>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field w-full">
          <option value="PKR">Pakistani Rupee (Rs.)</option>
          <option value="INR">Indian Rupee (₹)</option>
          <option value="USD">US Dollar ($)</option>
          <option value="EUR">Euro (€)</option>
        </select>
        <p className="text-slate-500 text-sm mt-2">Save profile to apply currency.</p>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="theme" checked={theme === 'light'} onChange={() => setTheme('light')} className="w-4 h-4" />
            <span>Light</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="w-4 h-4" />
            <span>Dark</span>
          </label>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-2">Export & Logout</h2>
        <p className="text-slate-500 text-sm mb-4">Export (Excel/PDF) can be added later. Logout below.</p>
        <button type="button" onClick={logout} className="btn-secondary">
          Logout
        </button>
      </section>

      <section className="card border-red-200 dark:border-red-800">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Delete account</h2>
        <p className="text-slate-500 text-sm mb-2">This cannot be undone. Type DELETE to confirm.</p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="DELETE"
          className="input-field w-full max-w-xs mb-3"
        />
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== 'DELETE'}
          className="px-4 py-2 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete account
        </button>
      </section>
    </div>
  );
}
