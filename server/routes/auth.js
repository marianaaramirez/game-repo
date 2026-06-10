/**
 * routes/auth.js
 * Endpoints:
 *   POST /api/register  — create a new Player (bcrypt-hashed password)
 *   POST /api/login     — verify credentials, return a JWT
 *   GET  /api/me        — return current player (requires JWT)
 */

import express from 'express';
import bcrypt  from 'bcrypt';
import jwt     from 'jsonwebtoken';
import db      from '../db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const BCRYPT_ROUNDS = 10;
const TOKEN_TTL     = '7d'; // JWT expires in 7 days

/**
 * POST /api/register
 * Body: { username, password }
 * Returns: { token, playerID, username }
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'username must be 3-50 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  try {
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO Player (username, password) VALUES (?, ?)',
      [username, hashed]
    );
    const playerID = result.insertId;

    const token = jwt.sign({ playerID, username }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
    return res.status(201).json({ token, playerID, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username already taken' });
    }
    console.error('[register] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * POST /api/login
 * Body: { username, password }
 * Returns: { token, playerID, username }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT playerID, username, password FROM Player WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const player = rows[0];
    const ok = await bcrypt.compare(password, player.password);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      { playerID: player.playerID, username: player.username },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );
    return res.json({ token, playerID: player.playerID, username: player.username });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/me
 * Returns: { playerID, username, created_at }
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT playerID, username, created_at FROM Player WHERE playerID = ?',
      [req.player.playerID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'player not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('[me] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;

// AI tool used for code commenting: Claude (Anthropic)
