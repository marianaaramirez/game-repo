/**
 * routes/save.js
 * Pause + resume — persistent snapshots of in-progress runs.
 *
 *   PUT    /api/run/:id/save  — save a state snapshot for this run
 *   GET    /api/run/:id/save  — load the saved snapshot
 *   GET    /api/saved-runs    — list current player's saved runs
 *   DELETE /api/run/:id/save  — delete the saved snapshot
 */

import express from 'express';
import db      from '../db.js';
import auth    from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper — verify the run exists and belongs to the player.
 */
async function assertRunOwned(runID, playerID, res) {
  try {
    const [rows] = await db.query(
      'SELECT playerID FROM Run WHERE runID = ?',
      [runID]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'run not found' });
      return false;
    }
    if (rows[0].playerID !== playerID) {
      res.status(403).json({ error: 'run does not belong to this player' });
      return false;
    }
    return true;
  } catch (err) {
    console.error('[assertRunOwned] error:', err);
    res.status(500).json({ error: 'internal server error' });
    return false;
  }
}

/**
 * PUT /api/run/:id/save
 * Body: { state: <any json> }
 * Upserts the JSON snapshot for this run.
 */
router.put('/run/:id/save', auth, async (req, res) => {
  const runID = parseInt(req.params.id, 10);
  if (isNaN(runID)) {
    return res.status(400).json({ error: 'invalid runID' });
  }
  const state = req.body && req.body.state;
  if (!state || typeof state !== 'object') {
    return res.status(400).json({ error: 'state object is required' });
  }
  if (!(await assertRunOwned(runID, req.player.playerID, res))) return;

  try {
    // Upsert via INSERT ... ON DUPLICATE KEY UPDATE
    await db.query(
      `INSERT INTO RunSave (runID, state_json) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)`,
      [runID, JSON.stringify(state)]
    );
    return res.status(200).json({ saved: true, runID });
  } catch (err) {
    console.error('[save put] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/run/:id/save
 * Returns the saved state JSON for this run.
 */
router.get('/run/:id/save', auth, async (req, res) => {
  const runID = parseInt(req.params.id, 10);
  if (isNaN(runID)) {
    return res.status(400).json({ error: 'invalid runID' });
  }
  if (!(await assertRunOwned(runID, req.player.playerID, res))) return;

  try {
    const [rows] = await db.query(
      'SELECT state_json, saved_at FROM RunSave WHERE runID = ?',
      [runID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'no save for this run' });
    }
    // mysql2 returns JSON columns already parsed (object), but just in case
    const state = typeof rows[0].state_json === 'string'
      ? JSON.parse(rows[0].state_json)
      : rows[0].state_json;
    return res.json({ runID, state, saved_at: rows[0].saved_at });
  } catch (err) {
    console.error('[save get] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/saved-runs
 * Lists all saved runs for the current player with Run + save metadata.
 */
router.get('/saved-runs', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         r.runID,
         r.world_level,
         r.skin_selected,
         r.enemies_defeated,
         r.duration,
         r.start_date,
         rs.saved_at
       FROM RunSave rs
       JOIN Run r ON r.runID = rs.runID
       WHERE r.playerID = ? AND r.result = 'ongoing'
       ORDER BY rs.saved_at DESC`,
      [req.player.playerID]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[saved-runs list] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * DELETE /api/run/:id/save
 * Removes the save (used after resuming successfully, or manual cleanup).
 */
router.delete('/run/:id/save', auth, async (req, res) => {
  const runID = parseInt(req.params.id, 10);
  if (isNaN(runID)) {
    return res.status(400).json({ error: 'invalid runID' });
  }
  if (!(await assertRunOwned(runID, req.player.playerID, res))) return;

  try {
    await db.query('DELETE FROM RunSave WHERE runID = ?', [runID]);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[save delete] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;
