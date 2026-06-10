/**
 * routes/player.js
 * Player profile endpoints — aggregated per-player metadata derived from Runs.
 *
 *   GET /api/player/me/profile  — last skin used + cleared levels list
 */

import express from 'express';
import db      from '../db.js';
import auth    from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/player/me/profile
 * Returns:
 *   { playerID, username, lastSkin, clearedLevels: [1,2,...] }
 *
 *   lastSkin       — skin_selected from the most recent Run (default 0)
 *   clearedLevels  — DISTINCT world_level where any Run.result = 'win'
 */
router.get('/player/me/profile', auth, async (req, res) => {
  const playerID = req.player.playerID;
  try {
    // Most recent Run's skin selection (default 0 if no runs)
    const [skinRows] = await db.query(
      `SELECT skin_selected FROM Run
       WHERE playerID = ?
       ORDER BY start_date DESC
       LIMIT 1`,
      [playerID]
    );
    const lastSkin = skinRows.length > 0 ? skinRows[0].skin_selected : 0;

    // Cleared levels: distinct world_level from won runs
    const [clearedRows] = await db.query(
      `SELECT DISTINCT world_level FROM Run
       WHERE playerID = ? AND result = 'win'
       ORDER BY world_level`,
      [playerID]
    );
    const clearedLevels = clearedRows.map((r) => r.world_level);

    return res.json({
      playerID,
      username: req.player.username,
      lastSkin,
      clearedLevels,
    });
  } catch (err) {
    console.error('[profile] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;

// AI tool used for code commenting: Claude (Anthropic)
