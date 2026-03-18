'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { folders, transactions } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import type { Folder, Transaction } from '@/lib/api';

function groupByDate(list: Transaction[]) {
  const groups: { date: string; label: string; items: Transaction[] }[] = [];
  let currentDate = '';
  let currentLabel = '';
  for (const t of list) {
    const d = t.date.slice(0, 10);
    const dt = new Date(t.date);
    const label = formatDate(dt);
    if (d !== currentDate) {
      currentDate = d;
      currentLabel = label;
      groups.push({ date: d, label: currentLabel, items: [] });
    }
    groups[groups.length - 1].items.push(t);
  }
  return groups;
}

export default function FolderReportPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const currency = user?.currency || 'PKR';
  const [folder, setFolder] = useState<Folder | null>(null);
  const [list, setList] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      folders.get(id),
      transactions.list({ folderId: id, limit: 500 }),
      transactions.summary({ folderId: id }),
    ])
      .then(([f, res, s]) => {
        if (!cancelled) {
          setFolder(f);
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
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/dashboard/folders/${id}`} className="text-sky-600 dark:text-sky-400 hover:underline text-sm">
          ← Back to folder
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="report-content bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-6 rounded-xl print:p-0 print:bg-transparent print:shadow-none">
        <h1 className="text-2xl font-bold mb-1">{folder.title}</h1>
        {folder.note && (
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{folder.note}</p>
        )}
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Report generated on {formatDate(new Date())} · All time
        </p>

        {summary != null && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Income</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.totalIncome, currency)}</p>
            </div>
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Expense</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary.totalExpense, currency)}</p>
            </div>
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase">Balance</p>
              <p className="text-xl font-bold">{formatCurrency(summary.balance, currency)}</p>
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold mb-3">Transactions by date</h2>
        {list.length === 0 ? (
          <p className="text-slate-500 py-4">No transactions in this folder.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.date}>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  {g.label} ({g.date})
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="text-left py-2 font-medium">Description</th>
                      <th className="text-left py-2 font-medium">Type</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 dark:border-slate-700">
                        <td className="py-2">{t.note || t.category?.name}</td>
                        <td className="py-2 capitalize">{t.type}</td>
                        <td className={`py-2 text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
