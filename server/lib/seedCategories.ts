import { randomUUID } from 'crypto';
import { query } from './db.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: '🍕' },
  { name: 'Shopping', type: 'expense', icon: '🛒' },
  { name: 'Travel', type: 'expense', icon: '🚕' },
  { name: 'Bills', type: 'expense', icon: '💡' },
  { name: 'Health', type: 'expense', icon: '🏥' },
  { name: 'Other', type: 'expense', icon: '💰' },
  { name: 'Salary', type: 'income', icon: '💼' },
  { name: 'Business', type: 'income', icon: '💰' },
  { name: 'Freelance', type: 'income', icon: '💻' },
  { name: 'Gift', type: 'income', icon: '🎁' },
  { name: 'Other', type: 'income', icon: '💰' },
];

export async function seedDefaultCategories() {
  const { rows } = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM categories WHERE user_id IS NULL'
  );
  const count = parseInt(rows[0]?.count ?? '0', 10);
  if (count > 0) return;

  for (const c of DEFAULT_CATEGORIES) {
    await query(
      'INSERT INTO categories (id, name, type, icon, user_id) VALUES ($1, $2, $3, $4, NULL)',
      [randomUUID(), c.name, c.type, c.icon]
    );
  }
  console.log('Default categories seeded.');
}
