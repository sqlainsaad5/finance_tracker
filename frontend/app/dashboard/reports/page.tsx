'use client';

import { useEffect, useState } from 'react';
import { reports } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CHART_COLORS = ['#16a34a','#dc2626','#0ea5e9','#f59e0b','#8b5cf6','#ec4899'];

export default function ReportsPage() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<{
    totalIncome: number;
    totalExpense: number;
    savings: number;
    expenseByCategory: { categoryName: string; amount: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    reports.monthly(month, year).then((d) => {
      if (!cancelled) setData(d);
    }).catch(() => { if (!cancelled) setData(null); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month, year]);

  if (loading) return <div className="py-12 text-center text-slate-500">Loading...</div>;

  const maxCat = Math.max(...(data?.expenseByCategory?.map((c) => c.amount) ?? [1]), 1);
  const pieData = (data?.expenseByCategory ?? []).map((c, i) => ({ name: c.categoryName, value: c.amount, color: CHART_COLORS[i % CHART_COLORS.length] }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Monthly Summary</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          className="input-field w-32"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          className="input-field w-24"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Total Income</p>
          <p className="text-xl font-bold text-income">{formatCurrency(data?.totalIncome ?? 0, currency)}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Total Expense</p>
          <p className="text-xl font-bold amount-expense">{formatCurrency(data?.totalExpense ?? 0, currency)}</p>
        </div>
        <div className="card">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Savings</p>
          <p className="text-xl font-bold text-balance">{formatCurrency(data?.savings ?? 0, currency)}</p>
        </div>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Expense by Category</h2>
        {!data?.expenseByCategory?.length ? (
          <p className="text-slate-500 py-6">No expense data for this month.</p>
        ) : (
          <div className="space-y-3">
            {(data.expenseByCategory).map((c, i) => (
              <div key={c.categoryName} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium">{c.categoryName}</span>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(c.amount / maxCat) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
                <span className="w-20 text-right font-medium amount-expense text-sm">{formatCurrency(c.amount, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {pieData.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Pie Chart</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {data?.expenseByCategory?.length ? (
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Bar Chart</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.expenseByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="categoryName" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€'}${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </div>
  );
}
