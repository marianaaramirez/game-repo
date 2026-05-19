/**
 * EnemyFactory.js
 * Centralized factory for spawning enemy instances.
 * Used by MapScene to create enemies when the player enters a node.
 *
 * Enemy pools:
 *   BASIC_ENEMIES  — 6 normal enemies, random selection for battle nodes
 *   BOSSES_BY_WORLD — 1 boss per world (Vampire King, Bone Mage, Titan)
 *   TRAP_ENEMIES   — 2 special enemies from trap chests (CardThief, Swapper)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Slime from './Slime.js';
import Spider from './Spider.js';
import Skeleton from './Skeleton.js';
import BoneMage from './BoneMage.js';
import VampireKing from './VampireKing.js';

// Pool of all standard battle enemies
const BASIC_ENEMIES = [Slime, Spider, Skeleton];

// One boss per world level
const BOSSES_BY_WORLD = {
  1: VampireKing,
  2: BoneMage,
  3: Skeleton,
};

// Enemies that appear exclusively from trap chest encounters
const TRAP_ENEMIES = [Slime, Spider];

/**
 * Creates a random standard enemy from the basic enemy pool.
 * Called when the player enters a BATTLE node on the map.
 * {BaseEnemy}
 */
function createRandomEnemy() {
  const EnemyClass = BASIC_ENEMIES[Math.floor(Math.random() * BASIC_ENEMIES.length)];
  return new EnemyClass();
}

/**
 * Creates the boss for the given world level.
 * Falls back to VampireKing if worldLevel has no mapped boss.
 * {number} worldLevel
 * {BaseEnemy}
 */
function createBoss(worldLevel) {
  const BossClass = BOSSES_BY_WORLD[worldLevel] || VampireKing;
  return new BossClass();
}

/**
 * Creates a random trap enemy (CardThief or Swapper).
 * Called when a TRAP chest triggers an enemy encounter.
 * {BaseEnemy}
 */
function createTrapEnemy() {
  const TrapClass = TRAP_ENEMIES[Math.floor(Math.random() * TRAP_ENEMIES.length)];
  return new TrapClass();
}

export default { createRandomEnemy, createBoss, createTrapEnemy };
