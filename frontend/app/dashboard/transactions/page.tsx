'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { transactions, categories } from '@/lib/api';
import { formatCurrency, formatDate, formatCategoryIcon } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import type { Transaction, Category } from '@/lib/api';

function groupByDate(list: Transaction[]) {
  const groups: { date: string; label: string; items: Transaction[] }[] = [];
  let currentDate = '';
  let currentLabel = '';
  for (const t of list) {
    const d = t.date.slice(0, 10);
    const dt = new Date(t.date);
    const today = new Date();
    const isToday = d === today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d === yesterday.toISOString().slice(0, 10);
    const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : formatDate(dt);
    if (d !== currentDate) {
      currentDate = d;
      currentLabel = label;
      groups.push({ date: d, label: currentLabel, items: [] });
    }
    groups[groups.length - 1].items.push(t);
  }
  return groups;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const currency = user?.currency || 'PKR';
  const [list, setList] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [catList, setCatList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 20;

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this transaction?')) return;
    setDeletingId(id);
    try {
      await transactions.delete(id);
      setList((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    categories.list().then(setCatList).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    transactions
      .list({ page, limit, search: search || undefined, type: typeFilter || undefined, categoryId: categoryFilter || undefined })
      .then((res) => {
        if (!cancelled) {
          setList(res.list);
          setTotal(res.total);
        }
      })
      .catch(() => { if (!cancelled) setList([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, typeFilter, categoryFilter]);

  const groups = groupByDate(list);
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Transactions</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by note..."
          className="input-field flex-1"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All categories</option>
          {catList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card py-12 text-center text-slate-500">Loading...</div>
      ) : list.length === 0 ? (
        <div className="card py-12 text-center text-slate-500">No transactions found.</div>
      ) : (
        <>
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.date}>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  {g.label} — {g.date}
                </p>
                <div className="card divide-y divide-slate-100 dark:divide-slate-700">
                  {g.items.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg -mx-2 px-2 flex-wrap gap-2"
                    >
                      <Link
                        href={`/dashboard/transactions/${t.id}`}
                        className="flex items-center justify-between flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{formatCategoryIcon(t.category?.icon)}</span>
                          <div>
                            <p className="font-medium">{t.note || t.category?.name}</p>
                            <p className="text-xs text-slate-500">{t.category?.name}</p>
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
                  ))}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary py-2 px-3 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary py-2 px-3 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
