import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import type { UserRow } from '../types/db.js';

const router = Router();
router.use(requireAuth);

router.get('/profile', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rows } = await query<UserRow>(
    'SELECT id, name, email, currency, theme FROM users WHERE id = $1',
    [userId]
  );
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user.id, name: user.name, email: user.email, currency: user.currency, theme: user.theme });
});

router.patch('/profile', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { name, email, password, currency, theme } = req.body;

  if (typeof email === 'string' && email.trim()) {
    const emailNorm = email.trim().toLowerCase();
    const { rows } = await query<UserRow>('SELECT id FROM users WHERE email = $1 AND id != $2', [emailNorm, userId]);
    if (rows.length > 0) return res.status(400).json({ error: 'Email already in use' });
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (typeof name === 'string' && name.trim()) {
    updates.push(`name = $${idx++}`);
    params.push(name.trim());
  }
  if (typeof email === 'string' && email.trim()) {
    updates.push(`email = $${idx++}`);
    params.push(email.trim().toLowerCase());
  }
  if (typeof password === 'string' && password.length >= 6) {
    const passwordHash = await bcrypt.hash(password, 10);
    updates.push(`password_hash = $${idx++}`);
    params.push(passwordHash);
  }
  if (['INR', 'USD', 'EUR'].includes(currency)) {
    updates.push(`currency = $${idx++}`);
    params.push(currency);
  }
  if (['light', 'dark'].includes(theme)) {
    updates.push(`theme = $${idx++}`);
    params.push(theme);
  }

  if (updates.length === 0) {
    const { rows } = await query<UserRow>('SELECT id, name, email, currency, theme FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, name: user.name, email: user.email, currency: user.currency, theme: user.theme });
  }

  updates.push('updated_at = NOW()');
  params.push(userId);
  await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
    params
  );
  const { rows } = await query<UserRow>('SELECT id, name, email, currency, theme FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user.id, name: user.name, email: user.email, currency: user.currency, theme: user.theme });
});

router.delete('/account', async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  await query('DELETE FROM users WHERE id = $1', [userId]);
  return res.json({ message: 'Account deleted' });
});

export default router;
