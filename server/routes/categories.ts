import { randomUUID } from 'crypto';
import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import type { CategoryRow } from '../types/db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rows } = await query<CategoryRow>(
    'SELECT id, name, type, icon, user_id FROM categories WHERE user_id IS NULL OR user_id = $1 ORDER BY type, name',
    [userId]
  );
  return res.json(rows.map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon })));
});

router.post('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { name, type, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  if (!['income', 'expense'].includes(type)) return res.status(400).json({ error: 'Type must be income or expense' });
  const id = randomUUID();
  await query(
    'INSERT INTO categories (id, name, type, icon, user_id) VALUES ($1, $2, $3, $4, $5)',
    [id, name.trim(), type, icon?.trim() || '💰', userId]
  );
  const { rows } = await query<CategoryRow>('SELECT id, name, type, icon, user_id FROM categories WHERE id = $1', [id]);
  const category = rows[0];
  return res.status(201).json({ id: category!.id, name: category!.name, type: category!.type, icon: category!.icon });
});

export default router;
