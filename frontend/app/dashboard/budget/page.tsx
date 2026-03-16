'use client';

import { useEffect, useState } from 'react';
import { budget, categories, transactions } from '@/lib/api';
import { formatCurrency, formatCategoryIcon } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import type { Category } from '@/lib/api';

export default function BudgetPage() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [budgets, setBudgets] = useState<{ categoryId: string; category: Category; amount: number }[]>([]);
  const [expenseCats, setExpenseCats] = useState<Category[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{ totalExpense: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      budget.list(month, year),
      categories.list(),
      transactions.summary({
        from: new Date(year, month - 1, 1).toISOString(),
        to: new Date(year, month, 0, 23, 59, 59).toISOString(),
      }),
    ]).then(([bList, catList, s]) => {
      if (cancelled) return;
      const expense = catList.filter((c) => c.type === 'expense');
      setExpenseCats(expense);
      const byCat: Record<string, string> = {};
      bList.forEach((b) => { byCat[b.categoryId] = String(b.amount); });
      expense.forEach((c) => { if (!(c.id in byCat)) byCat[c.id] = '0'; });
      setAmounts(byCat);
      setBudgets(bList);
      setSummary(s);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month, year]);

  async function handleSave() {
    const payload = Object.entries(amounts)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([categoryId, v]) => ({ categoryId, amount: parseFloat(v) || 0 }));
    setSaving(true);
    try {
      await budget.save(payload);
      const bList = await budget.list(month, year);
      setBudgets(bList);
    } finally {
      setSaving(false);
    }
  }

  const spentByCat = new Map<string, number>();
  if (summary) {
    // We don't have per-category spent from summary; would need an extra API. For now show budget vs 0.
  }

  if (loading) return <div className="py-12 text-center text-slate-500">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Set Monthly Budget</h1>
      <p className="text-slate-500">Budget for {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>

      <div className="card space-y-4">
        {expenseCats.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3">
            <span className="text-xl w-8">{formatCategoryIcon(c.icon)}</span>
            <label className="flex-1 min-w-[100px] font-medium">{c.name}</label>
            <input
              type="number"
              min="0"
              step="100"
              value={amounts[c.id] ?? ''}
              onChange={(e) => setAmounts((prev) => ({ ...prev, [c.id]: e.target.value }))}
              className="input-field w-32"
              placeholder="0"
            />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-4">
          {saving ? 'Saving...' : 'Save budget'}
        </button>
      </div>

      {summary && (
        <div className="card">
          <p className="text-slate-500 text-sm">Total expense this month: <strong className="amount-expense">{formatCurrency(summary.totalExpense, currency)}</strong></p>
        </div>
      )}
    </div>
  );
}
