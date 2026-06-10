/**
 * routes/admin.js
 * Administrator accounts + global analytics dashboard.
 *
 *   POST /api/admin/register  — create a new Admin (bcrypt-hashed password)
 *   POST /api/admin/login     — verify credentials, return an admin JWT
 *   GET  /api/admin/me        — return current admin (requires admin JWT)
 *   GET  /api/admin/stats     — global game analytics across ALL players
 *
 * Admin JWTs carry { adminID, username, role: 'admin' } so adminAuth can
 * distinguish them from player tokens.
 */

import express from 'express';
import bcrypt  from 'bcrypt';
import jwt     from 'jsonwebtoken';
import db      from '../db.js';
import adminAuth from '../middleware/adminAuth.js';
import { computePlayerStats } from './stats.js';

const router = express.Router();
const BCRYPT_ROUNDS = 10;
const TOKEN_TTL     = '7d';

/**
 * Chest drop-rate configuration (design values).
 * Chest outcomes are decided at runtime and NOT logged per-event, so the admin
 * verifies balance against the configured probabilities used by the game:
 *   - MapSystem.randomChestType()  → 50% REWARD / 50% TRAP
 *   - RewardScene (reward chest)   → 60% card / 40% heal (25% max HP)
 *   - MapScene.handleChest (trap)  → 50% trap enemy / 50% math challenge
 */
const CHEST_BALANCE = {
  chestType: [
    { outcome: 'Reward chest', chance: 0.5 },
    { outcome: 'Trap chest',   chance: 0.5 },
  ],
  rewardChest: [
    { outcome: 'Card (attack/defense)', chance: 0.6 },
    { outcome: 'Heal (25% max HP)',     chance: 0.4 },
  ],
  trapChest: [
    { outcome: 'Trap enemy combat', chance: 0.5 },
    { outcome: 'Math challenge',    chance: 0.5 },
  ],
};

// ============================================================
// Auth
// ============================================================

/**
 * POST /api/admin/register
 * Body: { username, password }
 * Returns: { token, adminID, username }
 */
router.post('/admin/register', async (req, res) => {
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
      'INSERT INTO Admin (username, password) VALUES (?, ?)',
      [username, hashed]
    );
    const adminID = result.insertId;
    const token = jwt.sign(
      { adminID, username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );
    return res.status(201).json({ token, adminID, username });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username already taken' });
    }
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Admin table missing — run `npm run migrate`' });
    }
    console.error('[admin register] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * POST /api/admin/login
 * Body: { username, password }
 * Returns: { token, adminID, username }
 */
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT adminID, username, password FROM Admin WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = jwt.sign(
      { adminID: admin.adminID, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );
    return res.json({ token, adminID: admin.adminID, username: admin.username });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Admin table missing — run `npm run migrate`' });
    }
    console.error('[admin login] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/admin/me
 * Returns: { adminID, username, created_at }
 */
router.get('/admin/me', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT adminID, username, created_at FROM Admin WHERE adminID = ?',
      [req.admin.adminID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'admin not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('[admin me] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

// ============================================================
// Analytics
// ============================================================

/**
 * GET /api/admin/stats
 * Global analytics across ALL players. Admin-only.
 * Returns:
 *   combats   { wins, losses, ongoing, total }
 *   problems  { correct, incorrect, total, accuracy }
 *   avgResponseTimeMs
 *   enemies   [{ name, type, appearances, percentage }]
 *   chestBalance { chestType, rewardChest, trapChest }
 */
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    // 1. Combat win/loss totals across all players
    const [combatAgg] = await db.query(
      `SELECT
         COUNT(*)                                              AS total,
         SUM(CASE WHEN combat_result = 'win'  THEN 1 ELSE 0 END) AS wins,
         SUM(CASE WHEN combat_result = 'lose' THEN 1 ELSE 0 END) AS losses,
         SUM(CASE WHEN combat_result = 'ongoing' THEN 1 ELSE 0 END) AS ongoing
       FROM Combat`
    );

    // 2. Correct/incorrect answers across all problems
    // 3. Average response time across all problems
    const [problemAgg] = await db.query(
      `SELECT
         COUNT(*)                                          AS total,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)        AS correct,
         SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END)    AS incorrect,
         COALESCE(AVG(response_time), 0)                    AS avgMs
       FROM ProblemStats`
    );

    // 4. Enemy apparition percentage across all combats
    const [enemyRows] = await db.query(
      `SELECT
         e.name        AS name,
         e.type        AS type,
         COUNT(c.combatID) AS appearances
       FROM Enemy e
       LEFT JOIN Combat c ON c.enemyID = e.enemyID
       GROUP BY e.enemyID, e.name, e.type
       ORDER BY appearances DESC, e.name`
    );

    const combats = combatAgg[0] || {};
    const probs   = problemAgg[0] || {};

    const combatTotal  = Number(combats.total)    || 0;
    const problemTotal = Number(probs.total)       || 0;
    const correct      = Number(probs.correct)     || 0;

    // Percentage relative to total combats that have an enemy logged
    const enemyTotal = enemyRows.reduce((sum, r) => sum + Number(r.appearances), 0);
    const enemies = enemyRows.map((r) => {
      const appearances = Number(r.appearances) || 0;
      return {
        name:        r.name,
        type:        r.type,
        appearances,
        percentage:  enemyTotal > 0 ? appearances / enemyTotal : 0,
      };
    });

    return res.json({
      combats: {
        total:   combatTotal,
        wins:    Number(combats.wins)    || 0,
        losses:  Number(combats.losses)  || 0,
        ongoing: Number(combats.ongoing) || 0,
      },
      problems: {
        total:     problemTotal,
        correct,
        incorrect: Number(probs.incorrect) || 0,
        accuracy:  problemTotal > 0 ? correct / problemTotal : 0,
      },
      avgResponseTimeMs: Math.round(Number(probs.avgMs) || 0),
      enemies,
      chestBalance: CHEST_BALANCE,
    });
  } catch (err) {
    console.error('[admin stats] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/admin/players
 * Full leaderboard of ALL players (not capped at 10), sorted by wins.
 * Admin-only. Each row: { playerID, username, totalRuns, wins, enemiesDefeated }.
 */
router.get('/admin/players', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         p.playerID,
         p.username,
         COUNT(r.runID)                                          AS totalRuns,
         SUM(CASE WHEN r.result = 'win' THEN 1 ELSE 0 END)       AS wins,
         COALESCE(SUM(r.enemies_defeated), 0)                    AS enemiesDefeated
       FROM Player p
       LEFT JOIN Run r ON r.playerID = p.playerID
       GROUP BY p.playerID, p.username
       ORDER BY wins DESC, enemiesDefeated DESC, p.username ASC`
    );
    return res.json(rows.map((r) => ({
      playerID:        r.playerID,
      username:        r.username,
      totalRuns:       Number(r.totalRuns)       || 0,
      wins:            Number(r.wins)            || 0,
      enemiesDefeated: Number(r.enemiesDefeated) || 0,
    })));
  } catch (err) {
    console.error('[admin players] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/admin/player/:playerID/stats
 * Per-player stats in the same shape as GET /api/stats, so the admin can view
 * any player's stats exactly like that player sees their own "My Stats".
 * Admin-only.
 */
router.get('/admin/player/:playerID/stats', adminAuth, async (req, res) => {
  const playerID = parseInt(req.params.playerID, 10);
  if (isNaN(playerID)) {
    return res.status(400).json({ error: 'invalid playerID' });
  }
  try {
    const [rows] = await db.query(
      'SELECT playerID, username FROM Player WHERE playerID = ?',
      [playerID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'player not found' });
    }
    const stats = await computePlayerStats(playerID);
    return res.json({ username: rows[0].username, ...stats });
  } catch (err) {
    console.error('[admin player stats] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;

// AI tool used for code commenting: Claude (Anthropic)
