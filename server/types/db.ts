export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  currency: string;
  theme: string;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryRow {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  user_id: string | null;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  category_id: string;
  amount: number | string;
  type: string;
  date: Date;
  note: string | null;
  payment_method: string | null;
  created_at: Date;
}

export interface FolderRow {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  created_at: Date;
}

export interface BudgetRow {
  id: string;
  user_id: string;
  category_id: string;
  amount: number | string;
  month: number;
  year: number;
  created_at: Date;
  updated_at: Date;
}
