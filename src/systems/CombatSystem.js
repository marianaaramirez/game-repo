/**
 * CombatSystem.js
 * Pure logic module that manages the turn-based combat loop.
 * Handles player action evaluation, damage application, defense calculation,
 * and win/lose condition checks. Has no Phaser dependencies — all rendering
 * is handled separately in CombatScene.js.
 *
 * Turn order:
 *   1. Player selects card
 *   2. Player answers math problem
 *   3. System evaluates answer + timer → applies card effect
 *   4. Enemy takes its action (attack or skill)
 *   5. Repeat until one side reaches 0 HP
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import MathSystem from './MathSystem.js';
import TimerSystem from './TimerSystem.js';

// All possible states the combat can be in at any given moment
const COMBAT_STATE = {
  SELECT_CARD:  'select_card',  // Waiting for player to choose a card
  MATH_PROBLEM: 'math_problem', // Math problem is displayed, waiting for input
  EVALUATE:     'evaluate',     // Checking answer and applying effect
  ENEMY_TURN:   'enemy_turn',   // Enemy is acting
  WIN:          'win',          // Enemy HP reached 0
  LOSE:         'lose',         // Player HP reached 0
};

/**
 * Evaluates the outcome of a player card activation.
 * Checks correctness and whether the timer has expired,
 * then returns the final effect value after applying the timer multiplier.
 *
 * {object} card         - The card being activated
 * {object} problem      - The math problem that was generated
 * {string} playerAnswer - The answer typed by the player
 * {number} elapsed      - Milliseconds elapsed since the problem appeared
 * {object} {{ success: boolean, effect: number, multiplier: number }}
 */
function evaluatePlayerAction(card, problem, playerAnswer, elapsed) {
  const correct   = MathSystem.check(problem, playerAnswer);
  const timedOut  = TimerSystem.isExpired(elapsed);

  // Wrong answer or timeout → no effect
  if (!correct || timedOut) {
    return { success: false, effect: 0, multiplier: 0 };
  }

  // Scale card's base value by the timer multiplier (1.0, 0.75, or 0.5)
  const multiplier = TimerSystem.getMultiplier(elapsed);
  const effect     = Math.round(card.baseValue * multiplier);

  return { success: true, effect, multiplier };
}

/**
 * Applies raw attack damage to a target entity.
 * {object} target - Entity receiving damage (has .hp property)
 * {number} damage
 * {boolean} True if the target was killed (hp reached 0)
 */
function applyAttack(target, damage) {
  target.hp = Math.max(0, target.hp - damage);
  return target.hp <= 0;
}

/**
 * Applies incoming damage to the player after subtracting active defense.
 * {object} player
 * {number} defense       - Points blocked by the player's defense card
 * {number} incomingDamage
 * {number} Actual damage taken after defense reduction
 */
function applyDefense(player, defense, incomingDamage) {
  const reduced = Math.max(0, incomingDamage - defense);
  player.hp = Math.max(0, player.hp - reduced);
  return reduced;
}

/**
 * Executes the enemy's attack turn.
 * If the player has active defense, applies it before dealing damage.
 * {object} enemy
 * {object} player
 * {number} activeDefense - Defense value from player's last defense card (default 0)
 * {number} Damage dealt to the player
 */
function enemyTurn(enemy, player, activeDefense = 0) {
  const damage = enemy.attackPower;
  if (activeDefense > 0) {
    return applyDefense(player, activeDefense, damage);
  }
  player.hp = Math.max(0, player.hp - damage);
  return damage;
}

/**
 * Checks whether the player has won the combat.
 * {object} enemy
 * returns {boolean}
 */
function checkWin(enemy) {
  return enemy.hp <= 0;
}

/**
 * Checks whether the player has lost the combat.
 * {object} player
 * returns {boolean}
 */
function checkLose(player) {
  return player.hp <= 0;
}

export default {
  COMBAT_STATE,
  evaluatePlayerAction,
  applyAttack,
  applyDefense,
  enemyTurn,
  checkWin,
  checkLose,
};
