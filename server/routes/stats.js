/**
 * routes/stats.js
 * Aggregated player statistics for the StatsScene UI.
 *
 *   GET /api/stats        — stats for the current authenticated player
 *   GET /api/leaderboard  — global top players (read-only, no auth needed)
 */

import express from 'express';
import db      from '../db.js';
import auth    from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/stats
 * Returns aggregated stats for the current player, plus a per-world breakdown.
 */
router.get('/stats', auth, async (req, res) => {
  const playerID = req.player.playerID;

  try {
    // Run-level aggregates
    const [runAgg] = await db.query(
      `SELECT
         COUNT(*)                                                   AS totalRuns,
         SUM(CASE WHEN result = 'win'  THEN 1 ELSE 0 END)            AS wins,
         SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END)            AS losses,
         SUM(CASE WHEN result = 'ongoing' THEN 1 ELSE 0 END)         AS ongoing,
         COALESCE(SUM(enemies_defeated), 0)                          AS enemiesDefeated,
         COALESCE(SUM(duration), 0)                                  AS timePlayed,
         COALESCE(MAX(CASE WHEN result = 'win' THEN world_level END), 0) AS highestWorldCleared
       FROM Run WHERE playerID = ?`,
      [playerID]
    );

    // Problem-level aggregates
    const [problemAgg] = await db.query(
      `SELECT
         COUNT(*)                                                   AS totalProblems,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)                AS correctProblems,
         COALESCE(AVG(response_time), 0)                            AS avgResponseTime
       FROM ProblemStats ps
       JOIN Run r ON r.runID = ps.runID
       WHERE r.playerID = ?`,
      [playerID]
    );

    // Per-world breakdown
    const [byWorld] = await db.query(
      `SELECT
         r.world_level                                                AS world_level,
         COUNT(DISTINCT r.runID)                                      AS runs,
         SUM(CASE WHEN r.result = 'win' THEN 1 ELSE 0 END)            AS wins,
         COALESCE(SUM(r.enemies_defeated), 0)                         AS enemies,
         (SELECT COUNT(*) FROM ProblemStats ps2
            JOIN Run r2 ON r2.runID = ps2.runID
            WHERE r2.playerID = ? AND r2.world_level = r.world_level) AS problems,
         (SELECT SUM(CASE WHEN ps2.is_correct THEN 1 ELSE 0 END)
            FROM ProblemStats ps2
            JOIN Run r2 ON r2.runID = ps2.runID
            WHERE r2.playerID = ? AND r2.world_level = r.world_level) AS correct
       FROM Run r
       WHERE r.playerID = ?
       GROUP BY r.world_level
       ORDER BY r.world_level`,
      [playerID, playerID, playerID]
    );

    const stats = runAgg[0]    || {};
    const probs = problemAgg[0] || {};
    const total = Number(stats.totalRuns) || 0;
    const correct = Number(probs.correctProblems) || 0;
    const totalProblems = Number(probs.totalProblems) || 0;

    return res.json({
      totalRuns:          total,
      wins:               Number(stats.wins)            || 0,
      losses:             Number(stats.losses)          || 0,
      ongoing:            Number(stats.ongoing)         || 0,
      winRate:            total > 0 ? Number(stats.wins) / total : 0,
      totalProblems,
      correctProblems:    correct,
      accuracy:           totalProblems > 0 ? correct / totalProblems : 0,
      avgResponseTime:    Math.round(Number(probs.avgResponseTime) || 0),
      enemiesDefeated:    Number(stats.enemiesDefeated) || 0,
      timePlayed:         Number(stats.timePlayed)      || 0,
      highestWorldCleared: Number(stats.highestWorldCleared) || 0,
      byWorld: (byWorld || []).map((w) => ({
        world_level: w.world_level,
        runs:        Number(w.runs)     || 0,
        wins:        Number(w.wins)     || 0,
        enemies:     Number(w.enemies)  || 0,
        problems:    Number(w.problems) || 0,
        correct:     Number(w.correct)  || 0,
      })),
    });
  } catch (err) {
    console.error('[stats] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/leaderboard
 * Top 10 players sorted by wins, with their problem-solving stats.
 */
router.get('/leaderboard', async (req, res) => {
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
       ORDER BY wins DESC, enemiesDefeated DESC
       LIMIT 10`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[leaderboard] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;
