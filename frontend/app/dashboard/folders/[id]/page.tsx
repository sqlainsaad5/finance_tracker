'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, Plus, Trash2, FileText, Pencil } from 'lucide-react';
import { folders, transactions } from '@/lib/api';
import { formatCurrency, formatDate, formatCategoryIcon } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import type { Folder, Transaction } from '@/lib/api';

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

export default function FolderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const currency = user?.currency || 'PKR';
  const [folder, setFolder] = useState<Folder | null>(null);
  const [list, setList] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      folders.get(id),
      transactions.list({ folderId: id, limit: 100 }),
      transactions.summary({ folderId: id }),
    ])
      .then(([f, res, s]) => {
        if (!cancelled) {
          setFolder(f);
          setEditTitle(f.title);
          setEditNote(f.note || '');
          setList(res.list);
          setSummary(s);
        }
      })
      .catch(() => {
        if (!cancelled) setFolder(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete(e: React.MouseEvent, txId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this transaction?')) return;
    setDeletingId(txId);
    try {
      await transactions.delete(txId);
      setList((prev) => prev.filter((t) => t.id !== txId));
      if (summary != null) {
        const s = await transactions.summary({ folderId: id });
        setSummary(s);
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveEdit() {
    if (!folder || !editTitle.trim()) return;
    try {
      const updated = await folders.update(id, { title: editTitle.trim(), note: editNote.trim() || undefined });
      setFolder(updated);
      setEditing(false);
    } catch {
      // ignore
    }
  }

  if (loading && !folder) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="card py-12 text-center">
        <p className="text-slate-500">Folder not found.</p>
        <Link href="/dashboard/folders" className="text-sky-600 dark:text-sky-400 hover:underline mt-2 inline-block">
          Back to Folders
        </Link>
      </div>
    );
  }

  const groups = groupByDate(list);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/folders" className="text-sky-600 dark:text-sky-400 hover:underline text-sm">
        ← Back to Folders
      </Link>

      <div className="card">
        <div className="flex items-start gap-3">
          <FolderOpen size={28} className="shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field font-semibold"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Note (optional)"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleSaveEdit} className="btn-primary">
                    Save
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setEditTitle(folder.title); setEditNote(folder.note || ''); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{folder.title}</h1>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Edit folder"
                    aria-label="Edit folder"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                {folder.note && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{folder.note}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {summary != null && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card border-l-4 border-green-500">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Income</p>
            <p className="text-lg font-bold text-income">{formatCurrency(summary.totalIncome, currency)}</p>
          </div>
          <div className="card border-l-4 border-red-500">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Expense</p>
            <p className="text-lg font-bold amount-expense">{formatCurrency(summary.totalExpense, currency)}</p>
          </div>
          <div className="card border-l-4 border-sky-500">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Balance</p>
            <p className="text-lg font-bold text-balance">{formatCurrency(summary.balance, currency)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/add?folderId=${id}`}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Add transaction
        </Link>
        <Link
          href={`/dashboard/folders/${id}/report`}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <FileText size={20} />
          View report
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Transactions</h2>
        {list.length === 0 ? (
          <div className="card py-12 text-center text-slate-500">
            No transactions in this folder yet. Add one with the button above.
          </div>
        ) : (
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
                            <p className="text-xs text-slate-500">{t.category?.name}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 ${t.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                          {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, currency)}
                        </span>
                      </Link>
                      <Link
                        href={`/dashboard/transactions/${t.id}/edit`}
                        className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                        title="Edit"
                        aria-label="Edit transaction"
                      >
                        <Pencil size={18} />
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
        )}
      </section>
    </div>
  );
}
