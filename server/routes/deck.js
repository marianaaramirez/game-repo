/**
 * routes/deck.js
 * Cross-session persistence for the player's card collection (attack + defense).
 * Skill cards have their own route file (skillDeck.js).
 *
 *   GET    /api/deck                          — list owned cards (with is_active flag)
 *   POST   /api/deck/cards                    — add a card to the collection
 *   PUT    /api/deck/cards/:deckCardID/active — toggle is_active on one card
 *   DELETE /api/deck                          — wipe the collection (roguelike defeat)
 */

import express from 'express';
import db      from '../db.js';
import auth    from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper — returns the deckID for this player, creating a Deck row if missing.
 * Race-safe: relies on the UNIQUE(playerID) constraint added in migration 002.
 * INSERT IGNORE no-ops if the row already exists, SELECT then returns the row.
 */
async function ensureDeck(playerID) {
  await db.query('INSERT IGNORE INTO Deck (playerID) VALUES (?)', [playerID]);
  const [rows] = await db.query(
    'SELECT deckID FROM Deck WHERE playerID = ? LIMIT 1',
    [playerID]
  );
  return rows[0].deckID;
}

/**
 * GET /api/deck
 * Returns array of owned cards joined with Card metadata.
 * Each row is one card instance.
 */
router.get('/deck', auth, async (req, res) => {
  try {
    const deckID = await ensureDeck(req.player.playerID);
    const [rows] = await db.query(
      `SELECT
         dc.deckCardID,
         dc.cardID,
         dc.is_active,
         c.name,
         c.type,
         c.world_level,
         c.description,
         c.power_value,
         c.special
       FROM DeckCard dc
       JOIN Card c ON c.cardID = dc.cardID
       WHERE dc.deckID = ?
       ORDER BY dc.deckCardID`,
      [deckID]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[deck list] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * POST /api/deck/cards
 * Body: { cardID, is_active? }
 * Creates a new DeckCard instance. Returns the new deckCardID.
 */
router.post('/deck/cards', auth, async (req, res) => {
  const { cardID, is_active = false } = req.body || {};
  if (!cardID) {
    return res.status(400).json({ error: 'cardID is required' });
  }

  try {
    // Validate card exists and is attack/defense (not skill — those use skillDeck)
    const [cardRows] = await db.query(
      'SELECT cardID, type FROM Card WHERE cardID = ?',
      [cardID]
    );
    if (cardRows.length === 0) {
      return res.status(404).json({ error: 'card not found' });
    }
    if (cardRows[0].type === 'skill') {
      return res.status(400).json({ error: 'skill cards belong to /skill-deck, not /deck' });
    }

    const deckID = await ensureDeck(req.player.playerID);
    const [result] = await db.query(
      'INSERT INTO DeckCard (deckID, cardID, is_active) VALUES (?, ?, ?)',
      [deckID, cardID, !!is_active]
    );
    return res.status(201).json({
      deckCardID: result.insertId,
      deckID,
      cardID,
      is_active: !!is_active,
    });
  } catch (err) {
    console.error('[deck add] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * PUT /api/deck/cards/:deckCardID/active
 * Body: { is_active: boolean }
 * Updates the is_active flag on one specific card instance.
 */
router.put('/deck/cards/:deckCardID/active', auth, async (req, res) => {
  const deckCardID = parseInt(req.params.deckCardID, 10);
  if (isNaN(deckCardID)) {
    return res.status(400).json({ error: 'invalid deckCardID' });
  }
  if (typeof req.body?.is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active (boolean) is required' });
  }

  const MAX_ACTIVE = 4;

  try {
    // Verify ownership via Deck.playerID
    const [rows] = await db.query(
      `SELECT dc.deckCardID, dc.deckID FROM DeckCard dc
       JOIN Deck d ON d.deckID = dc.deckID
       WHERE dc.deckCardID = ? AND d.playerID = ?`,
      [deckCardID, req.player.playerID]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'card instance not found in your deck' });
    }

    // If activating, enforce the max-active cap to keep DB consistent with UI.
    if (req.body.is_active === true) {
      const [count] = await db.query(
        'SELECT COUNT(*) AS active FROM DeckCard WHERE deckID = ? AND is_active = TRUE AND deckCardID != ?',
        [rows[0].deckID, deckCardID]
      );
      if (Number(count[0].active) >= MAX_ACTIVE) {
        return res.status(409).json({ error: `deck already has ${MAX_ACTIVE} active cards` });
      }
    }

    await db.query(
      'UPDATE DeckCard SET is_active = ? WHERE deckCardID = ?',
      [!!req.body.is_active, deckCardID]
    );
    return res.json({ deckCardID, is_active: !!req.body.is_active });
  } catch (err) {
    console.error('[deck active] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * DELETE /api/deck
 * Wipes the player's entire collection (used on roguelike defeat).
 * Skill cards are untouched — they live in SkillDeck table.
 */
router.delete('/deck', auth, async (req, res) => {
  try {
    const deckID = await ensureDeck(req.player.playerID);
    await db.query('DELETE FROM DeckCard WHERE deckID = ?', [deckID]);
    return res.json({ wiped: true, deckID });
  } catch (err) {
    console.error('[deck wipe] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;

// AI tool used for code commenting: Claude (Anthropic)
