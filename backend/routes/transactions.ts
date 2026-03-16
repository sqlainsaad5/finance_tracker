import { randomUUID } from 'crypto';
import { Router } from 'express';
import { query, toNum } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import type { CategoryRow } from '../types/db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit), 10) || 20));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const type = req.query.type as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const folderId = req.query.folderId as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  if (folderId) {
    const { rows: folderCheck } = await query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderCheck.length === 0) return res.status(400).json({ error: 'Folder not found' });
  }

  const conditions = ['t.user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;
  if (folderId) {
    conditions.push(`t.folder_id = $${idx++}`);
    params.push(folderId);
  }
  if (type && ['income', 'expense'].includes(type)) {
    conditions.push(`t.type = $${idx++}`);
    params.push(type);
  }
  if (categoryId) {
    conditions.push(`t.category_id = $${idx++}`);
    params.push(categoryId);
  }
  if (from) {
    conditions.push(`t.date >= $${idx++}`);
    params.push(new Date(from));
  }
  if (to) {
    conditions.push(`t.date <= $${idx++}`);
    params.push(new Date(to));
  }
  if (search) {
    conditions.push(`t.note ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }
  const where = conditions.join(' AND ');
  const countParams = [...params];
  params.push(limit, (page - 1) * limit);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const [listRes, countRes] = await Promise.all([
    query<{
      id: string;
      amount: string;
      type: string;
      category_id: string;
      date: Date;
      note: string | null;
      payment_method: string | null;
      folder_id: string | null;
      c_id: string;
      c_name: string;
      c_type: string;
      c_icon: string | null;
    }>(
      `SELECT t.id, t.amount, t.type, t.category_id, t.date, t.note, t.payment_method, t.folder_id,
              c.id AS c_id, c.name AS c_name, c.type AS c_type, c.icon AS c_icon
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE ${where}
       ORDER BY t.date DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM transactions t WHERE ${where}`,
      countParams
    ),
  ]);

  const total = parseInt(countRes.rows[0]?.count ?? '0', 10);
  const list = listRes.rows.map((t) => ({
    id: t.id,
    amount: toNum(t.amount),
    type: t.type,
    categoryId: t.category_id,
    category: { id: t.c_id, name: t.c_name, type: t.c_type, icon: t.c_icon },
    date: new Date(t.date).toISOString(),
    note: t.note,
    paymentMethod: t.payment_method,
    folderId: t.folder_id ?? undefined,
  }));

  return res.json({ list, total, page, limit });
});

router.get('/recent', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const take = Math.min(10, Math.max(1, parseInt(String(req.query.limit), 10) || 5));
  const folderId = req.query.folderId as string | undefined;
  const conditions = ['t.user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;
  if (folderId) {
    const { rows: folderCheck } = await query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderCheck.length === 0) return res.status(400).json({ error: 'Folder not found' });
    conditions.push('t.folder_id = $' + idx++);
    params.push(folderId);
  }
  params.push(take);
  const { rows } = await query<{
    id: string;
    amount: string;
    type: string;
    date: Date;
    note: string | null;
    c_id: string;
    c_name: string;
    c_type: string;
    c_icon: string | null;
  }>(
    `SELECT t.id, t.amount, t.type, t.date, t.note, c.id AS c_id, c.name AS c_name, c.type AS c_type, c.icon AS c_icon
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.date DESC
     LIMIT $${idx}`,
    params
  );
  return res.json(
    rows.map((t) => ({
      id: t.id,
      amount: toNum(t.amount),
      type: t.type,
      category: { id: t.c_id, name: t.c_name, type: t.c_type, icon: t.c_icon },
      date: new Date(t.date).toISOString(),
      note: t.note,
    }))
  );
});

router.get('/summary', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const folderId = req.query.folderId as string | undefined;
  if (folderId) {
    const { rows: folderCheck } = await query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderCheck.length === 0) return res.status(400).json({ error: 'Folder not found' });
  }
  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;
  if (folderId) {
    conditions.push(`folder_id = $${idx++}`);
    params.push(folderId);
  }
  if (from) {
    conditions.push(`date >= $${idx++}`);
    params.push(new Date(from));
  }
  if (to) {
    conditions.push(`date <= $${idx++}`);
    params.push(new Date(to));
  }
  const where = conditions.join(' AND ');
  const [incomeRes, expenseRes] = await Promise.all([
    query<{ sum: string }>(`SELECT COALESCE(SUM(amount), 0)::text AS sum FROM transactions WHERE ${where} AND type = 'income'`, params),
    query<{ sum: string }>(`SELECT COALESCE(SUM(amount), 0)::text AS sum FROM transactions WHERE ${where} AND type = 'expense'`, params),
  ]);
  const totalIncome = toNum(incomeRes.rows[0]?.sum);
  const totalExpense = toNum(expenseRes.rows[0]?.sum);
  return res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense });
});

router.get('/dates', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const limit = Math.min(365, Math.max(30, parseInt(String(req.query.limit), 10) || 90));
  const folderId = req.query.folderId as string | undefined;
  if (folderId) {
    const { rows: folderCheck } = await query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderCheck.length === 0) return res.status(400).json({ error: 'Folder not found' });
  }
  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;
  if (folderId) {
    conditions.push('folder_id = $' + idx++);
    params.push(folderId);
  }
  params.push(limit);
  const { rows } = await query<{ d: string }>(
    `SELECT DISTINCT to_char(date::date, 'YYYY-MM-DD') AS d
     FROM transactions
     WHERE ${conditions.join(' AND ')}
     ORDER BY d DESC
     LIMIT $${idx}`,
    params
  );
  return res.json(rows.map((r) => r.d));
});

router.get('/:id', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rows } = await query<{
    id: string;
    amount: string;
    type: string;
    date: Date;
    note: string | null;
    payment_method: string | null;
    folder_id: string | null;
    f_title: string | null;
    c_id: string;
    c_name: string;
    c_type: string;
    c_icon: string | null;
  }>(
    `SELECT t.id, t.amount, t.type, t.date, t.note, t.payment_method, t.folder_id, f.title AS f_title,
            c.id AS c_id, c.name AS c_name, c.type AS c_type, c.icon AS c_icon
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     LEFT JOIN folders f ON t.folder_id = f.id AND f.user_id = t.user_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [req.params.id, userId]
  );
  const t = rows[0];
  if (!t) return res.status(404).json({ error: 'Transaction not found' });
  const out: Record<string, unknown> = {
    id: t.id,
    amount: toNum(t.amount),
    type: t.type,
    category: { id: t.c_id, name: t.c_name, type: t.c_type, icon: t.c_icon },
    date: new Date(t.date).toISOString(),
    note: t.note,
    paymentMethod: t.payment_method,
  };
  if (t.folder_id) {
    out.folderId = t.folder_id;
    if (t.f_title) out.folder = { id: t.folder_id, title: t.f_title };
  }
  return res.json(out);
});

router.post('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { amount, type, categoryId, date, note, paymentMethod, folderId } = req.body;
  if (amount == null || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }
  if (!categoryId) return res.status(400).json({ error: 'Category required' });
  const { rows: catRows } = await query<CategoryRow>(
    'SELECT id FROM categories WHERE id = $1 AND (user_id IS NULL OR user_id = $2)',
    [categoryId, userId]
  );
  if (catRows.length === 0) return res.status(400).json({ error: 'Invalid category' });
  if (folderId) {
    const { rows: folderRows } = await query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderRows.length === 0) return res.status(400).json({ error: 'Folder not found' });
  }
  const id = randomUUID();
  const txDate = date ? new Date(date) : new Date();
  await query(
    'INSERT INTO transactions (id, user_id, category_id, amount, type, date, note, payment_method, folder_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    [id, userId, categoryId, amount, type, txDate, note?.trim() || null, paymentMethod?.trim() || 'Other', folderId || null]
  );
  const { rows } = await query<CategoryRow>('SELECT id, name, type, icon FROM categories WHERE id = $1', [categoryId]);
  const category = rows[0]!;
  const out: Record<string, unknown> = {
    id,
    amount,
    type,
    category: { id: category.id, name: category.name, type: category.type, icon: category.icon },
    date: txDate.toISOString(),
    note: note?.trim() || null,
    paymentMethod: paymentMethod?.trim() || 'Other',
  };
  if (folderId) out.folderId = folderId;
  return res.status(201).json(out);
});

router.put('/:id', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { amount, type, categoryId, date, note, paymentMethod, folderId } = req.body;
  const { rows: existing } = await query('SELECT id FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
  if (existing.length === 0) return res.status(404).json({ error: 'Transaction not found' });

  if (folderId !== undefined) {
    const { rows: folderRows } = await query(
      'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (folderId && folderRows.length === 0) return res.status(400).json({ error: 'Folder not found' });
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (amount != null && typeof amount === 'number' && amount > 0) {
    updates.push(`amount = $${idx++}`);
    params.push(amount);
  }
  if (['income', 'expense'].includes(type)) {
    updates.push(`type = $${idx++}`);
    params.push(type);
  }
  if (categoryId) {
    const { rows: catRows } = await query<CategoryRow>(
      'SELECT id, name, type, icon FROM categories WHERE id = $1 AND (user_id IS NULL OR user_id = $2)',
      [categoryId, userId]
    );
    if (catRows.length > 0) {
      updates.push(`category_id = $${idx++}`);
      params.push(categoryId);
    }
  }
  if (date) {
    updates.push(`date = $${idx++}`);
    params.push(new Date(date));
  }
  if (note !== undefined) {
    updates.push(`note = $${idx++}`);
    params.push(note?.trim() || null);
  }
  if (paymentMethod !== undefined) {
    updates.push(`payment_method = $${idx++}`);
    params.push(paymentMethod?.trim() || 'Other');
  }
  if (folderId !== undefined) {
    updates.push(`folder_id = $${idx++}`);
    params.push(folderId || null);
  }
  if (updates.length > 0) {
    params.push(req.params.id, userId);
    await query(`UPDATE transactions SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx}`, params);
  }
  const { rows } = await query<{
    id: string;
    amount: string;
    type: string;
    date: Date;
    note: string | null;
    payment_method: string | null;
    folder_id: string | null;
    f_title: string | null;
    c_id: string;
    c_name: string;
    c_type: string;
    c_icon: string | null;
  }>(
    `SELECT t.id, t.amount, t.type, t.date, t.note, t.payment_method, t.folder_id, f.title AS f_title,
            c.id AS c_id, c.name AS c_name, c.type AS c_type, c.icon AS c_icon
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     LEFT JOIN folders f ON t.folder_id = f.id AND f.user_id = t.user_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [req.params.id, userId]
  );
  const t = rows[0];
  if (!t) return res.status(404).json({ error: 'Transaction not found' });
  const putOut: Record<string, unknown> = {
    id: t.id,
    amount: toNum(t.amount),
    type: t.type,
    category: { id: t.c_id, name: t.c_name, type: t.c_type, icon: t.c_icon },
    date: new Date(t.date).toISOString(),
    note: t.note,
    paymentMethod: t.payment_method,
  };
  if (t.folder_id) {
    putOut.folderId = t.folder_id;
    if (t.f_title) putOut.folder = { id: t.folder_id, title: t.f_title };
  }
  return res.json(putOut);
});

router.delete('/:id', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rowCount } = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
  if (rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
  return res.json({ message: 'Deleted' });
});

export default router;
