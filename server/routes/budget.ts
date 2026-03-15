import { randomUUID } from 'crypto';
import { Router } from 'express';
import { query, toNum } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import type { BudgetRow, CategoryRow } from '../types/db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const month = parseInt(String(req.query.month), 10);
  const year = parseInt(String(req.query.year), 10);
  if (!month || !year) return res.status(400).json({ error: 'Month and year required' });
  const { rows } = await query<BudgetRow & { c_id: string; c_name: string; c_type: string; c_icon: string | null }>(
    'SELECT b.id, b.user_id, b.category_id, b.amount, b.month, b.year, c.id AS c_id, c.name AS c_name, c.type AS c_type, c.icon AS c_icon FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3',
    [userId, month, year]
  );
  return res.json(
    rows.map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      category: { id: r.c_id, name: r.c_name, type: r.c_type, icon: r.c_icon },
      amount: toNum(r.amount),
      month: r.month,
      year: r.year,
    }))
  );
});

router.put('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { budgets } = req.body as { budgets: { categoryId: string; amount: number }[] };
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  if (!Array.isArray(budgets)) return res.status(400).json({ error: 'budgets array required' });
  for (const b of budgets) {
    if (!b.categoryId || typeof b.amount !== 'number' || b.amount < 0) continue;
    const id = randomUUID();
    await query(
      `INSERT INTO budgets (id, user_id, category_id, amount, month, year)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, category_id, month, year)
       DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()`,
      [id, userId, b.categoryId, b.amount, month, year]
    );
  }
  const { rows } = await query<BudgetRow & { c_id: string; c_name: string; c_type: string; c_icon: string | null }>(
    'SELECT b.id, b.user_id, b.category_id, b.amount, b.month, b.year, c.id AS c_id, c.name AS c_name, c.type AS c_type, c.icon AS c_icon FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3',
    [userId, month, year]
  );
  return res.json(
    rows.map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      category: { id: r.c_id, name: r.c_name, type: r.c_type, icon: r.c_icon },
      amount: toNum(r.amount),
      month: r.month,
      year: r.year,
    }))
  );
});

export default router;
