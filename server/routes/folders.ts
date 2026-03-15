import { randomUUID } from 'crypto';
import { Router } from 'express';
import { query } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import type { FolderRow } from '../types/db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rows } = await query<FolderRow>(
    'SELECT id, user_id, title, note, created_at FROM folders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.json(
    rows.map((f) => ({
      id: f.id,
      title: f.title,
      note: f.note,
      createdAt: new Date(f.created_at).toISOString(),
    }))
  );
});

router.post('/', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { title, note } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  const id = randomUUID();
  await query(
    'INSERT INTO folders (id, user_id, title, note) VALUES ($1, $2, $3, $4)',
    [id, userId, title.trim(), note?.trim() || null]
  );
  const { rows } = await query<FolderRow>('SELECT id, user_id, title, note, created_at FROM folders WHERE id = $1', [
    id,
  ]);
  const folder = rows[0]!;
  return res.status(201).json({
    id: folder.id,
    title: folder.title,
    note: folder.note,
    createdAt: new Date(folder.created_at).toISOString(),
  });
});

router.get('/:id', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rows } = await query<FolderRow>(
    'SELECT id, user_id, title, note, created_at FROM folders WHERE id = $1 AND user_id = $2',
    [req.params.id, userId]
  );
  const folder = rows[0];
  if (!folder) return res.status(404).json({ error: 'Folder not found' });
  return res.json({
    id: folder.id,
    title: folder.title,
    note: folder.note,
    createdAt: new Date(folder.created_at).toISOString(),
  });
});

router.patch('/:id', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { title, note } = req.body;
  const { rows: existing } = await query(
    'SELECT id FROM folders WHERE id = $1 AND user_id = $2',
    [req.params.id, userId]
  );
  if (existing.length === 0) return res.status(404).json({ error: 'Folder not found' });

  const updates: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (title !== undefined) {
    updates.push(`title = $${idx++}`);
    params.push(title?.trim() ?? '');
  }
  if (note !== undefined) {
    updates.push(`note = $${idx++}`);
    params.push(note?.trim() || null);
  }
  if (updates.length > 0) {
    params.push(req.params.id, userId);
    await query(`UPDATE folders SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx}`, params);
  }

  const { rows } = await query<FolderRow>(
    'SELECT id, user_id, title, note, created_at FROM folders WHERE id = $1 AND user_id = $2',
    [req.params.id, userId]
  );
  const folder = rows[0]!;
  return res.json({
    id: folder.id,
    title: folder.title,
    note: folder.note,
    createdAt: new Date(folder.created_at).toISOString(),
  });
});

router.delete('/:id', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rowCount } = await query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
  if (rowCount === 0) return res.status(404).json({ error: 'Folder not found' });
  return res.json({ message: 'Deleted' });
});

export default router;
