import { randomUUID } from 'crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../lib/db.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import type { UserRow } from '../types/db.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    const emailNorm = email.trim().toLowerCase();
    const { rows: existing } = await query<UserRow>('SELECT id FROM users WHERE email = $1', [emailNorm]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    await query(
      'INSERT INTO users (id, name, email, password_hash, currency, theme) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name.trim(), emailNorm, passwordHash, 'INR', 'light']
    );
    const user = { id, name: name.trim(), email: emailNorm, currency: 'INR', theme: 'light' };
    const token = signToken({ userId: user.id, email: user.email });
    return res.status(201).json({ user, token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { rows } = await query<UserRow>(
      'SELECT id, name, email, password_hash, currency, theme FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken({ userId: user.id, email: user.email });
    return res.json({
      user: { id: user.id, name: user.name, email: user.email, currency: user.currency, theme: user.theme },
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const { rows } = await query('SELECT 1 FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  if (rows.length === 0) return res.json({ message: 'If an account exists, you will receive reset instructions.' });
  return res.json({ message: 'If an account exists, you will receive reset instructions.' });
});

router.get('/me', requireAuth, async (req, res) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { rows } = await query<UserRow>(
    'SELECT id, name, email, currency, theme FROM users WHERE id = $1',
    [userId]
  );
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user.id, name: user.name, email: user.email, currency: user.currency, theme: user.theme });
});

export default router;
