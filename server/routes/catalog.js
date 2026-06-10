/**
 * routes/catalog.js
 * Read-only endpoints exposing static game data (cards, enemies, maps).
 * No auth required — these are public catalog lookups.
 *
 *   GET /api/cards?world=1[&type=attack]
 *   GET /api/enemies?world=1[&type=basic]
 *   GET /api/maps
 */

import express from 'express';
import db      from '../db.js';

const router = express.Router();

/**
 * GET /api/cards
 * Query params: world (optional), type (optional)
 * Returns: array of Card rows.
 */
router.get('/cards', async (req, res) => {
  const { world, type } = req.query;
  const conditions = [];
  const values     = [];

  if (world !== undefined) {
    const w = parseInt(world, 10);
    if (isNaN(w)) return res.status(400).json({ error: 'world must be a number' });
    conditions.push('world_level = ?');
    values.push(w);
  }
  if (type !== undefined) {
    if (!['attack', 'defense', 'skill'].includes(type)) {
      return res.status(400).json({ error: 'type must be attack | defense | skill' });
    }
    conditions.push('type = ?');
    values.push(type);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const [rows] = await db.query(
      `SELECT cardID, name, type, world_level, description, power_value, special
       FROM Card ${whereClause} ORDER BY world_level, type, cardID`,
      values
    );
    return res.json(rows);
  } catch (err) {
    console.error('[cards list] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/enemies
 * Query params: world (optional), type (optional)
 */
router.get('/enemies', async (req, res) => {
  const { world, type } = req.query;
  const conditions = [];
  const values     = [];

  if (world !== undefined) {
    const w = parseInt(world, 10);
    if (isNaN(w)) return res.status(400).json({ error: 'world must be a number' });
    conditions.push('world_level = ?');
    values.push(w);
  }
  if (type !== undefined) {
    if (!['basic', 'trap', 'boss'].includes(type)) {
      return res.status(400).json({ error: 'type must be basic | trap | boss' });
    }
    conditions.push('type = ?');
    values.push(type);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const [rows] = await db.query(
      `SELECT enemyID, name, type, world_level, hp, attack_power, skill_name, skill_desc
       FROM Enemy ${whereClause} ORDER BY world_level, type, enemyID`,
      values
    );
    return res.json(rows);
  } catch (err) {
    console.error('[enemies list] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * GET /api/maps
 * Returns all world metadata.
 */
router.get('/maps', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT mapID, name, theme, world_level FROM Map ORDER BY world_level'
    );
    return res.json(rows);
  } catch (err) {
    console.error('[maps list] error:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

export default router;

// AI tool used for code commenting: Claude (Anthropic)
