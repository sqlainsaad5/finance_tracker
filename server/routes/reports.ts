import { Router } from 'express';
import { query, toNum } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/monthly', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const year = parseInt(String(req.query.year), 10) || new Date().getFullYear();
  const month = parseInt(String(req.query.month), 10) || new Date().getMonth() + 1;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [incomeRes, expenseRes, byCatRes] = await Promise.all([
    query<{ sum: string }>(
      'SELECT COALESCE(SUM(amount), 0)::text AS sum FROM transactions WHERE user_id = $1 AND type = $2 AND date >= $3 AND date <= $4',
      [userId, 'income', start, end]
    ),
    query<{ sum: string }>(
      'SELECT COALESCE(SUM(amount), 0)::text AS sum FROM transactions WHERE user_id = $1 AND type = $2 AND date >= $3 AND date <= $4',
      [userId, 'expense', start, end]
    ),
    query<{ category_id: string; sum: string }>(
      'SELECT category_id, COALESCE(SUM(amount), 0)::text AS sum FROM transactions WHERE user_id = $1 AND type = $2 AND date >= $3 AND date <= $4 GROUP BY category_id',
      [userId, 'expense', start, end]
    ),
  ]);

  const totalIncome = toNum(incomeRes.rows[0]?.sum);
  const totalExpense = toNum(expenseRes.rows[0]?.sum);
  const categoryIds = [...new Set(byCatRes.rows.map((r) => r.category_id))];
  let nameMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const placeholders = categoryIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows: catRows } = await query<{ id: string; name: string }>(
      `SELECT id, name FROM categories WHERE id IN (${placeholders})`,
      categoryIds
    );
    nameMap = new Map(catRows.map((c) => [c.id, c.name]));
  }
  const expenseByCategory = byCatRes.rows.map((r) => ({
    categoryId: r.category_id,
    categoryName: nameMap.get(r.category_id) ?? 'Other',
    amount: toNum(r.sum),
  }));
  expenseByCategory.sort((a, b) => b.amount - a.amount);

  return res.json({
    year,
    month,
    totalIncome,
    totalExpense,
    savings: totalIncome - totalExpense,
    expenseByCategory,
  });
});

export default router;
