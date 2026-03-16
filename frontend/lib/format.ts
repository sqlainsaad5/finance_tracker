const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };

export function formatCurrency(amount: number, currency = 'INR'): string {
  const sym = symbols[currency] || currency;
  return `${sym}${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Use 💰 instead of 📁 for category/transaction icons. */
export function formatCategoryIcon(icon: string | null | undefined): string {
  return icon === '📁' || icon == null ? '💰' : icon;
}
