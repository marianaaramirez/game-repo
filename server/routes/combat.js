/**
 * routes/combat.js
 * Endpoints for combat and math problem tracking.
 *
 *   POST /api/problem  — log a single math problem attempt
 *   POST /api/combat   — log a combat encounter result
 */

import express from 'express';
import db      from '../db.js';
import auth    from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper — verify the run exists and belongs to the current player.
 * Returns true on success, sends a 403/404 and returns false otherwise.
 */
async function assertRunOwned(runID, playerID, res) {
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
}

/**
 * POST /api/problem
 * Body: {
 *   runID, world_level, battle_number, difficulty, op_type,
 *   expression, answer, player_answer?, response_time, is_correct
 * }
 * Returns: { problemID }
 */
router.post('/problem', auth, async (req, res) => {
  const {
    runID,
    world_level,
    battle_number = 1,
    difficulty,
    op_type,
    expression,
    answer,
    player_answer = null,
    response_time = 0,
    is_correct    = false,
  } = req.body || {};

  if (!runID || !world_level || !difficulty || !op_type || !expression || answer === undefined) {
    return res.status(400).json({ error: 'missing required fields' });
  }

  if (!(await assertRunOwned(runID, req.player.playerID, res))) return;

  try {
    const [result] = await db.query(
      `INSERT INTO ProblemStats
       (runID, world_level, battle_number, difficulty, op_type,
        expression, answer, player_answer, response_time, is_correct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        runID, world_level, battle_number, difficulty, op_type,
        expression, answer, player_answer, response_time, !!is_correct,
      ]
    );
    return res.status(201).json({ problemID: result.insertId });
  } catch (err) {
    console.error('[problem create] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * POST /api/combat
 * Body: {
 *   runID, enemyID, problemID?,
 *   timer_result ('green'|'yellow'|'red'|'timeout'),
 *   damage_dealt, combat_result ('win'|'lose'|'ongoing'),
 *   cards_used? [{ cardID, turn_number }]
 * }
 * Returns: { combatID }
 */
router.post('/combat', auth, async (req, res) => {
  const {
    runID,
    enemyID,
    problemID     = null,
    timer_result  = 'timeout',
    damage_dealt  = 0,
    combat_result = 'ongoing',
    cards_used    = [],
  } = req.body || {};

  if (!runID || !enemyID) {
    return res.status(400).json({ error: 'runID and enemyID are required' });
  }
  if (!['green', 'yellow', 'red', 'timeout'].includes(timer_result)) {
    return res.status(400).json({ error: 'invalid timer_result' });
  }
  if (!['win', 'lose', 'ongoing'].includes(combat_result)) {
    return res.status(400).json({ error: 'invalid combat_result' });
  }

  if (!(await assertRunOwned(runID, req.player.playerID, res))) return;

  try {
    const [result] = await db.query(
      `INSERT INTO Combat
       (runID, enemyID, problemID, timer_result, damage_dealt, combat_result)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [runID, enemyID, problemID, timer_result, damage_dealt, combat_result]
    );
    const combatID = result.insertId;

    // Persist cards used during this combat (optional bulk insert)
    if (Array.isArray(cards_used) && cards_used.length > 0) {
      const values = cards_used.map((c) => [combatID, c.cardID, c.turn_number || 1]);
      await db.query(
        'INSERT INTO CardsUsed (combatID, cardID, turn_number) VALUES ?',
        [values]
      );
    }

    return res.status(201).json({ combatID });
  } catch (err) {
    console.error('[combat create] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;
