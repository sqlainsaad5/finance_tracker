'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { transactions, categories, folders } from '@/lib/api';
import type { Category, Folder } from '@/lib/api';

const PAYMENT_OPTIONS = ['UPI', 'Card', 'Cash', 'Bank', 'Other'];

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isValidDateParam(s: string | null): boolean {
  if (!s || s.length !== 10) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function AddTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Other');
  const [folderId, setFolderId] = useState<string>('');
  const [catList, setCatList] = useState<Category[]>([]);
  const [folderList, setFolderList] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const folderParam = searchParams.get('folderId');
    if (isValidDateParam(dateParam)) setDate(dateParam!);
    if (folderParam) setFolderId(folderParam);
  }, [searchParams]);

  useEffect(() => {
    categories.list().then(setCatList).catch(console.error);
    folders.list().then(setFolderList).catch(() => setFolderList([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount.replace(/,/g, ''));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    const filteredCats = catList.filter((c) => c.type === type);
    const other = filteredCats.find((c) => c.name === 'Other');
    const categoryId = other?.id ?? filteredCats[0]?.id;
    if (!categoryId) {
      setError('Unable to save: no category available. Please try again.');
      return;
    }
    setLoading(true);
    try {
      await transactions.create({
        amount: num,
        type,
        categoryId,
        date: new Date(date).toISOString(),
        note: description.trim() || undefined,
        paymentMethod,
        folderId: folderId || undefined,
      });
      if (folderId) router.push(`/dashboard/folders/${folderId}`);
      else router.push(`/dashboard?date=${date}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Transaction</h1>
      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Type</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" checked={type === 'income'} onChange={() => setType('income')} className="w-4 h-4" />
              <span className="font-medium text-green-600 dark:text-green-400">Income</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" checked={type === 'expense'} onChange={() => setType('expense')} className="w-4 h-4" />
              <span className="font-medium amount-expense">Expense</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            className="input-field"
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">What was it?</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="e.g. Papa gave ₹10,000 / Dinner at pizza hut"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Folder (optional)</label>
          <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="input-field">
            <option value="">None</option>
            {folderList.map((f) => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
            {PAYMENT_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
