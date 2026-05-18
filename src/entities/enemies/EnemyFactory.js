import Slime from './Slime.js';
import Golem from './Golem.js';
import Spider from './Spider.js';
import PredatorPlant from './PredatorPlant.js';
import Skeleton from './Skeleton.js';
import EvilBat from './EvilBat.js';
import VampireKing from './VampireKing.js';
import BoneMage from './BoneMage.js';
import Titan from './Titan.js';
import CardThief from './CardThief.js';
import Swapper from './Swapper.js';

const BASIC_ENEMIES = [Slime, Golem, Spider, PredatorPlant, Skeleton, EvilBat];

const BOSSES_BY_WORLD = {
  1: VampireKing,
  2: BoneMage,
  3: Titan,
};

const TRAP_ENEMIES = [CardThief, Swapper];

function createRandomEnemy() {
  const EnemyClass = BASIC_ENEMIES[Math.floor(Math.random() * BASIC_ENEMIES.length)];
  return new EnemyClass();
}

function createBoss(worldLevel) {
  const BossClass = BOSSES_BY_WORLD[worldLevel] || VampireKing;
  return new BossClass();
}

function createTrapEnemy() {
  const TrapClass = TRAP_ENEMIES[Math.floor(Math.random() * TRAP_ENEMIES.length)];
  return new TrapClass();
}

export default { createRandomEnemy, createBoss, createTrapEnemy };
