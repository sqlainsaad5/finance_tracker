'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { transactions, categories, folders } from '@/lib/api';
import { formatCategoryIcon } from '@/lib/format';
import type { Category, Folder } from '@/lib/api';

const PAYMENT_OPTIONS = ['UPI', 'Card', 'Cash', 'Bank', 'Other'];

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Other');
  const [folderId, setFolderId] = useState<string>('');
  const [catList, setCatList] = useState<Category[]>([]);
  const [folderList, setFolderList] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categories.list().then(setCatList).catch(console.error);
    folders.list().then(setFolderList).catch(() => setFolderList([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    transactions.get(id).then((t) => {
      setType(t.type as 'income' | 'expense');
      setAmount(String(t.amount));
      setCategoryId(t.categoryId);
      const d = new Date(t.date);
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setNote(t.note || '');
      setPaymentMethod(t.paymentMethod || 'Other');
      setFolderId(t.folderId || '');
    }).catch(() => router.push('/dashboard/transactions'));
  }, [id, router]);

  const filteredCats = catList.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount.replace(/,/g, ''));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!categoryId) {
      setError('Select a category');
      return;
    }
    setLoading(true);
    try {
      await transactions.update(id, {
        amount: num,
        type,
        categoryId,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
        paymentMethod,
        folderId: folderId || null,
      });
      router.push(`/dashboard/transactions/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Transaction</h1>
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
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field" required>
            {filteredCats.map((c) => (
              <option key={c.id} value={c.id}>{formatCategoryIcon(c.icon)} {c.name}</option>
            ))}
          </select>
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

        <div>
          <label className="block text-sm font-medium mb-1">Note (optional)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input-field" />
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
