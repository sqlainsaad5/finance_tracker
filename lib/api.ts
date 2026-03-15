const API = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token: optToken, ...rest } = options;
  const token = optToken ?? getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...rest, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data as T;
}

export type User = { id: string; name: string; email: string; currency: string; theme: string };
export type Category = { id: string; name: string; type: string; icon: string | null };
export type Folder = { id: string; title: string; note: string | null; createdAt: string };
export type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  category: Category;
  date: string;
  note: string | null;
  paymentMethod: string | null;
  folderId?: string;
  folder?: { id: string; title: string };
};

export const auth = {
  signup: (name: string, email: string, password: string) =>
    api<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      token: undefined,
    }),
  login: (email: string, password: string) =>
    api<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      token: undefined,
    }),
  forgotPassword: (email: string) =>
    api<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      token: undefined,
    }),
  me: () => api<User>('/api/auth/me'),
};

export const users = {
  profile: () => api<User>('/api/users/profile'),
  update: (data: Partial<{ name: string; email: string; password: string; currency: string; theme: string }>) =>
    api<User>('/api/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAccount: () => api<{ message: string }>('/api/users/account', { method: 'DELETE' }),
};

export const transactions = {
  list: (params?: { page?: number; limit?: number; search?: string; type?: string; categoryId?: string; folderId?: string; from?: string; to?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.limit != null) sp.set('limit', String(params.limit));
    if (params?.search) sp.set('search', params.search);
    if (params?.type) sp.set('type', params.type);
    if (params?.categoryId) sp.set('categoryId', params.categoryId);
    if (params?.folderId) sp.set('folderId', params.folderId);
    if (params?.from) sp.set('from', params.from);
    if (params?.to) sp.set('to', params.to);
    return api<{ list: Transaction[]; total: number; page: number; limit: number }>(`/api/transactions?${sp}`);
  },
  recent: (limit = 5, folderId?: string) => {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    if (folderId) sp.set('folderId', folderId);
    return api<Transaction[]>(`/api/transactions/recent?${sp}`);
  },
  dates: (limit = 90, folderId?: string) => {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    if (folderId) sp.set('folderId', folderId);
    return api<string[]>(`/api/transactions/dates?${sp}`);
  },
  summary: (params?: { from?: string; to?: string; folderId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.from) sp.set('from', params.from);
    if (params?.to) sp.set('to', params.to);
    if (params?.folderId) sp.set('folderId', params.folderId);
    return api<{ totalIncome: number; totalExpense: number; balance: number }>(`/api/transactions/summary?${sp}`);
  },
  get: (id: string) => api<Transaction>(`/api/transactions/${id}`),
  create: (body: { amount: number; type: 'income' | 'expense'; categoryId: string; date?: string; note?: string; paymentMethod?: string; folderId?: string }) =>
    api<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ amount: number; type: string; categoryId: string; date: string; note: string; paymentMethod: string; folderId: string | null }>) =>
    api<Transaction>(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api<{ message: string }>(`/api/transactions/${id}`, { method: 'DELETE' }),
};

export const categories = {
  list: () => api<Category[]>('/api/categories'),
  create: (name: string, type: 'income' | 'expense', icon?: string) =>
    api<Category>('/api/categories', { method: 'POST', body: JSON.stringify({ name, type, icon }) }),
};

export const folders = {
  list: () => api<Folder[]>('/api/folders'),
  get: (id: string) => api<Folder>(`/api/folders/${id}`),
  create: (data: { title: string; note?: string }) =>
    api<Folder>('/api/folders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ title: string; note: string }>) =>
    api<Folder>(`/api/folders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api<{ message: string }>(`/api/folders/${id}`, { method: 'DELETE' }),
};

export const budget = {
  list: (month: number, year: number) => api<{ id: string; categoryId: string; category: Category; amount: number }[]>(`/api/budget?month=${month}&year=${year}`),
  save: (budgets: { categoryId: string; amount: number }[]) =>
    api<unknown>('/api/budget', { method: 'PUT', body: JSON.stringify({ budgets }) }),
};

export const reports = {
  monthly: (month?: number, year?: number) =>
    api<{
      year: number;
      month: number;
      totalIncome: number;
      totalExpense: number;
      savings: number;
      expenseByCategory: { categoryId: string; categoryName: string; amount: number }[];
    }>(`/api/reports/monthly?month=${month ?? new Date().getMonth() + 1}&year=${year ?? new Date().getFullYear()}`),
};
