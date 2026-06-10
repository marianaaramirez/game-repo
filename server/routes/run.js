/**
 * routes/run.js
 * Endpoints for play sessions (one Run = one full playthrough of a world).
 *
 *   POST /api/run        — start a new run (world_level, skin_selected)
 *   PUT  /api/run/:id    — update run (result, duration, enemies_defeated)
 *   GET  /api/run/:id    — get a specific run
 *   GET  /api/runs       — list all runs for current player
 */

import express from 'express';
import db      from '../db.js';
import auth    from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/run
 * Body: { world_level, skin_selected }
 * Returns: { runID, world_level, skin_selected, start_date }
 */
router.post('/run', auth, async (req, res) => {
  const { world_level, skin_selected = 0 } = req.body || {};
  if (![1, 2, 3].includes(world_level)) {
    return res.status(400).json({ error: 'world_level must be 1, 2, or 3' });
  }
  if (![0, 1, 2].includes(skin_selected)) {
    return res.status(400).json({ error: 'skin_selected must be 0, 1, or 2' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Run (playerID, world_level, skin_selected)
       VALUES (?, ?, ?)`,
      [req.player.playerID, world_level, skin_selected]
    );
    return res.status(201).json({
      runID: result.insertId,
      world_level,
      skin_selected,
      playerID: req.player.playerID,
    });
  } catch (err) {
    console.error('[run create] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * PUT /api/run/:id
 * Body: { result?, duration?, enemies_defeated? }
 * Partial update — only provided fields are written.
 * Returns: updated row.
 */
router.put('/run/:id', auth, async (req, res) => {
  const runID = parseInt(req.params.id, 10);
  if (isNaN(runID)) {
    return res.status(400).json({ error: 'invalid runID' });
  }

  // Verify the run belongs to the authenticated player
  try {
    const [rows] = await db.query(
      'SELECT playerID FROM Run WHERE runID = ?',
      [runID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'run not found' });
    }
    if (rows[0].playerID !== req.player.playerID) {
      return res.status(403).json({ error: 'run does not belong to this player' });
    }
  } catch (err) {
    console.error('[run ownership] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }

  // Build a partial UPDATE based on provided fields
  const updates = [];
  const values  = [];
  const { result, duration, enemies_defeated } = req.body || {};

  if (result !== undefined) {
    if (!['win', 'lose', 'ongoing'].includes(result)) {
      return res.status(400).json({ error: 'result must be win | lose | ongoing' });
    }
    updates.push('result = ?');
    values.push(result);
  }
  if (duration !== undefined) {
    if (typeof duration !== 'number' || duration < 0) {
      return res.status(400).json({ error: 'duration must be a non-negative number' });
    }
    updates.push('duration = ?');
    values.push(duration);
  }
  if (enemies_defeated !== undefined) {
    if (typeof enemies_defeated !== 'number' || enemies_defeated < 0) {
      return res.status(400).json({ error: 'enemies_defeated must be a non-negative number' });
    }
    updates.push('enemies_defeated = ?');
    values.push(enemies_defeated);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'no fields to update' });
  }

  values.push(runID);
  try {
    await db.query(`UPDATE Run SET ${updates.join(', ')} WHERE runID = ?`, values);
    const [rows] = await db.query('SELECT * FROM Run WHERE runID = ?', [runID]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('[run update] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/run/:id
 * Returns: full Run row (if owned by current player).
 */
router.get('/run/:id', auth, async (req, res) => {
  const runID = parseInt(req.params.id, 10);
  if (isNaN(runID)) {
    return res.status(400).json({ error: 'invalid runID' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM Run WHERE runID = ? AND playerID = ?',
      [runID, req.player.playerID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'run not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('[run get] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/runs
 * Returns: all runs for the current player (newest first).
 */
router.get('/runs', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Run WHERE playerID = ? ORDER BY start_date DESC',
      [req.player.playerID]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[runs list] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;

// AI tool used for code commenting: Claude (Anthropic)
