'use client';

import { useEffect, useState } from 'react';
import { categories as catApi } from '@/lib/api';
import { formatCategoryIcon } from '@/lib/format';
import type { Category } from '@/lib/api';

export default function CategoriesPage() {
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catApi.list().then(setList).finally(() => setLoading(false));
  }, []);

  const expense = list.filter((c) => c.type === 'expense');
  const income = list.filter((c) => c.type === 'income');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Manage Categories</h1>

      {loading ? (
        <div className="card py-12 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Expense Categories</h2>
            <ul className="space-y-2">
              {expense.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-xl">{formatCategoryIcon(c.icon)}</span>
                  <span className="font-medium">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Income Categories</h2>
            <ul className="space-y-2">
              {income.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-xl">{formatCategoryIcon(c.icon)}</span>
                  <span className="font-medium">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="text-slate-500 text-sm">
        Default categories are shared. Custom categories can be added via API. Deleting categories that have transactions is not allowed.
      </p>
    </div>
  );
}
