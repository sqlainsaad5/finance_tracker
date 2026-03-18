'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { transactions } from '@/lib/api';
import { formatCurrency, formatDate, formatCategoryIcon } from '@/lib/format';
import type { Transaction } from '@/lib/api';

function isValidDateParam(s: string | null): boolean {
  if (!s || s.length !== 10) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; balance: number } | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [datesLoading, setDatesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currency = user?.currency || 'PKR';

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (isValidDateParam(dateParam)) setSelectedDate(dateParam);
  }, [searchParams]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this transaction?')) return;
    setDeletingId(id);
    try {
      await transactions.delete(id);
      setRecent((prev) => prev.filter((t) => t.id !== id));
      const s = await transactions.summary(
        selectedDate == null ? undefined : { from: selectedDate, to: nextDay(selectedDate) }
      );
      setSummary(s);
      const d = await transactions.dates(90);
      setDates(d);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    transactions.dates(90).then((d) => {
      if (!cancelled) setDates(d);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setDatesLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (selectedDate == null) {
          const [s, r] = await Promise.all([transactions.summary(), transactions.recent(5)]);
          if (!cancelled) {
            setSummary(s);
            setRecent(r);
          }
        } else {
          const to = nextDay(selectedDate);
          const [s, listRes] = await Promise.all([
            transactions.summary({ from: selectedDate, to }),
            transactions.list({ from: selectedDate, to, limit: 50 }),
          ]);
          if (!cancelled) {
            setSummary(s);
            setRecent(listRes.list);
          }
        }
      } catch {
        if (!cancelled) setSummary({ totalIncome: 0, totalExpense: 0, balance: 0 });
        if (!cancelled) setRecent([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDate]);

  if (datesLoading && dates.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] ?? 'User'}</h1>

      {dates.length > 0 && (
        <section>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">View by date</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedDate === null
                  ? 'bg-sky-600 text-white dark:bg-sky-500'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              All
            </button>
            {dates.map((d) => {
              const isSelected = selectedDate === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white dark:bg-sky-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {formatDate(d + 'T12:00:00Z')}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-slate-500">Loading...</div>
        </div>
      ) : (
        <>
          <section className="card text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide mb-1">
              {selectedDate ? `Balance for ${formatDate(selectedDate + 'T12:00:00Z')}` : 'Total Balance'}
            </p>
            <p className="text-3xl font-bold text-balance dark:text-sky-400">
              {formatCurrency(summary?.balance ?? 0, currency)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Income − Expense</p>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <div className="card border-l-4 border-green-500">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Income</p>
              <p className="text-xl font-bold text-income">{formatCurrency(summary?.totalIncome ?? 0, currency)}</p>
            </div>
            <div className="card border-l-4 border-red-500">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Expense</p>
              <p className="text-xl font-bold amount-expense">{formatCurrency(summary?.totalExpense ?? 0, currency)}</p>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {selectedDate ? `Transactions for ${formatDate(selectedDate + 'T12:00:00Z')}` : 'Recent Transactions'}
              </h2>
              {selectedDate == null && (
                <Link href="/dashboard/transactions" className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline">
                  View all
                </Link>
              )}
            </div>
            <div className="card divide-y divide-slate-100 dark:divide-slate-700">
              {recent.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">
                  {selectedDate ? 'No transactions on this day.' : 'No transactions yet. Add one below.'}
                </p>
              ) : (
                recent.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg -mx-2 px-2 gap-2"
                  >
                    <Link
                      href={`/dashboard/transactions/${t.id}`}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{formatCategoryIcon(t.category?.icon)}</span>
                        <div>
                          <p className="font-medium">{t.note || t.category?.name}</p>
                          <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 ${t.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                        {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, currency)}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, t.id)}
                      disabled={deletingId === t.id}
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      title="Delete"
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Link
                href={selectedDate ? `/dashboard/add?date=${selectedDate}` : '/dashboard/add'}
                className="inline-flex items-center gap-2 btn-primary"
              >
                <Plus size={20} />
                {selectedDate ? `Add for ${formatDate(selectedDate + 'T12:00:00Z')}` : 'Add transaction'}
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
