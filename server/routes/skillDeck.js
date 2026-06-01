/**
 * routes/skillDeck.js
 * Persistence for skill cards (roguelike progression — they survive defeat).
 *
 *   GET  /api/skill-deck       — list current player's unlocked skill cards
 *   POST /api/skill-deck       — unlock a skill card (boss reward)
 *   PUT  /api/skill-deck/equip — equip one skill card (unsets all others)
 *   DELETE /api/skill-deck/equip — unequip the currently equipped card
 */

import express from 'express';
import db      from '../db.js';
import auth    from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/skill-deck
 * Returns array of unlocked skill cards joined with Card metadata.
 */
router.get('/skill-deck', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         sd.skillDeckID,
         sd.cardID,
         sd.is_equipped,
         sd.unlocked_at,
         c.name,
         c.description,
         c.special
       FROM SkillDeck sd
       JOIN Card c ON c.cardID = sd.cardID
       WHERE sd.playerID = ?
       ORDER BY sd.unlocked_at ASC`,
      [req.player.playerID]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[skill-deck list] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * POST /api/skill-deck
 * Body: { cardID }
 * Unlocks a skill card. Idempotent — returns existing row if already owned.
 */
router.post('/skill-deck', auth, async (req, res) => {
  const { cardID } = req.body || {};
  if (!cardID) {
    return res.status(400).json({ error: 'cardID is required' });
  }

  try {
    // Verify the card is actually a skill card
    const [cardRows] = await db.query(
      'SELECT cardID, type FROM Card WHERE cardID = ?',
      [cardID]
    );
    if (cardRows.length === 0) {
      return res.status(404).json({ error: 'card not found' });
    }
    if (cardRows[0].type !== 'skill') {
      return res.status(400).json({ error: 'card is not a skill card' });
    }

    // UPSERT — UNIQUE constraint on (playerID, cardID) prevents duplicates
    await db.query(
      `INSERT IGNORE INTO SkillDeck (playerID, cardID) VALUES (?, ?)`,
      [req.player.playerID, cardID]
    );

    // Return the row (whether newly inserted or pre-existing)
    const [rows] = await db.query(
      `SELECT skillDeckID, cardID, is_equipped, unlocked_at
       FROM SkillDeck
       WHERE playerID = ? AND cardID = ?`,
      [req.player.playerID, cardID]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[skill-deck add] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * PUT /api/skill-deck/equip
 * Body: { cardID }
 * Sets the given card as equipped and clears the flag on all other cards
 * owned by this player. Player can have at most 1 equipped skill at a time.
 */
router.put('/skill-deck/equip', auth, async (req, res) => {
  const { cardID } = req.body || {};
  if (!cardID) {
    return res.status(400).json({ error: 'cardID is required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify ownership first
    const [owned] = await conn.query(
      'SELECT skillDeckID FROM SkillDeck WHERE playerID = ? AND cardID = ?',
      [req.player.playerID, cardID]
    );
    if (owned.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'player does not own this skill card' });
    }

    // Unequip all, then equip the chosen one
    await conn.query(
      'UPDATE SkillDeck SET is_equipped = FALSE WHERE playerID = ?',
      [req.player.playerID]
    );
    await conn.query(
      'UPDATE SkillDeck SET is_equipped = TRUE WHERE playerID = ? AND cardID = ?',
      [req.player.playerID, cardID]
    );

    await conn.commit();
    return res.json({ equipped: cardID });
  } catch (err) {
    await conn.rollback();
    console.error('[skill-deck equip] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  } finally {
    conn.release();
  }
});

/**
 * DELETE /api/skill-deck/equip
 * Unequips the currently equipped skill card (player chooses none).
 */
router.delete('/skill-deck/equip', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE SkillDeck SET is_equipped = FALSE WHERE playerID = ?',
      [req.player.playerID]
    );
    return res.json({ equipped: null });
  } catch (err) {
    console.error('[skill-deck unequip] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;
