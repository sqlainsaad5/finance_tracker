'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { transactions } from '@/lib/api';
import { formatCurrency, formatDate, formatCategoryIcon } from '@/lib/format';
import { useAuth } from '@/components/AuthProvider';
import type { Transaction } from '@/lib/api';
import { Pencil, Trash2 } from 'lucide-react';

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    transactions
      .get(id)
      .then(setTx)
      .catch(() => setTx(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id || !confirm('Delete this transaction?')) return;
    setDeleting(true);
    try {
      await transactions.delete(id);
      router.push('/dashboard/transactions');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-slate-500">Loading...</div>;
  if (!tx) return <div className="card py-12 text-center">Transaction not found. <Link href="/dashboard/transactions" className="text-sky-600 underline">Back to list</Link></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/dashboard/transactions" className="text-sky-600 dark:text-sky-400 hover:underline text-sm">
        ← Back to Transactions
      </Link>
      <h1 className="text-2xl font-bold">Transaction Details</h1>
      <div className="card space-y-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Category</p>
          <p className="text-lg font-medium">{formatCategoryIcon(tx.category?.icon)} {tx.category?.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Amount</p>
          <p className={`text-2xl font-bold ${tx.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
            {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount, currency)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Type</p>
          <p className="font-medium capitalize">{tx.type}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
          <p className="font-medium">{formatDate(tx.date)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Payment</p>
          <p className="font-medium">{tx.paymentMethod || 'Other'}</p>
        </div>
        {tx.note && (
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Note</p>
            <p className="font-medium">{tx.note}</p>
          </div>
        )}
        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Link href={`/dashboard/transactions/${id}/edit`} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Pencil size={18} /> Edit
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-primary flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700">
            <Trash2 size={18} /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
