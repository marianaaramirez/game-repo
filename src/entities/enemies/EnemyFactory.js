/**
 * EnemyFactory.js
 * Centralized factory for spawning enemy instances.
 * Used by MapScene to create enemies when the player enters a node.
 *
 * Enemy pools:
 *   BASIC_ENEMIES   — standard enemies, randomly chosen for battle nodes
 *   BOSSES_BY_WORLD — one boss per world (Vampire King, Bone Mage, Titan)
 *   TRAP_ENEMIES    — special enemies from trap chests (Card Thief, Swapper)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import Slime from './Slime.js';
import Spider from './Spider.js';
import Skeleton from './Skeleton.js';
import Golem from './Golem.js';
import PredatorPlant from './PredatorPlant.js';
import EvilBat from './EvilBat.js';
import VampireKing from './VampireKing.js';
import BoneMage from './BoneMage.js';
import Titan from './Titan.js';
import CardThief from './CardThief.js';
import Swapper from './Swapper.js';

// Pool of all standard battle enemies
const BASIC_ENEMIES = [Slime, Spider, Skeleton, Golem, PredatorPlant, EvilBat];

// One boss per world level
const BOSSES_BY_WORLD = {
  1: VampireKing,
  2: BoneMage,
  3: Titan,
};

// Enemies that appear exclusively from trap chest encounters
const TRAP_ENEMIES = [CardThief, Swapper];

/**
 * Creates a random standard enemy from the basic enemy pool.
 * Called when the player enters a BATTLE node on the map.
 * @returns {BaseEnemy}
 */
function createRandomEnemy() {
  const EnemyClass = BASIC_ENEMIES[Math.floor(Math.random() * BASIC_ENEMIES.length)];
  return new EnemyClass();
}

/**
 * Creates the boss for the given world level.
 * Falls back to VampireKing if worldLevel has no mapped boss.
 * @param {number} worldLevel
 * @returns {BaseEnemy}
 */
function createBoss(worldLevel) {
  const BossClass = BOSSES_BY_WORLD[worldLevel] || VampireKing;
  return new BossClass();
}

/**
 * Creates a random trap enemy (Card Thief or Swapper).
 * Called when a TRAP chest triggers an enemy encounter.
 * @returns {BaseEnemy}
 */
function createTrapEnemy() {
  const TrapClass = TRAP_ENEMIES[Math.floor(Math.random() * TRAP_ENEMIES.length)];
  return new TrapClass();
}

// Lookup map: enemy display name → constructor (used to rehydrate from saves).
const ENEMY_BY_NAME = {};
[...BASIC_ENEMIES, ...TRAP_ENEMIES, VampireKing, BoneMage, Titan].forEach((Cls) => {
  ENEMY_BY_NAME[new Cls().name] = Cls;
});

/**
 * Rebuilds a fresh enemy instance from its name. Returns null if unknown.
 */
function createByName(name) {
  const Cls = ENEMY_BY_NAME[name];
  return Cls ? new Cls() : null;
}

export default { createRandomEnemy, createBoss, createTrapEnemy, createByName };
