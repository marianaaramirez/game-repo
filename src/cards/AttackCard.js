/**
 * AttackCard.js
 * Concrete card class for attack-type cards.
 * When activated (math problem answered correctly), deals damage to the enemy
 * scaled by the timer multiplier.
 *
 * Available attack cards per world:
 *   World 1 (Ancient Temple): Quick Strike (12), Kick (15)
 *   World 2 (Castle):         Precise Lightning (18), Poison (10)
 *   World 3 (Wasteland):      Lightning Explosion (25), Fire Attack (22)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */
import BaseCard, { CARD_TYPES } from './BaseCard.js';

export default class AttackCard extends BaseCard {
  /**
   * {string} name       - Card display name
   * {number} baseValue  - Base damage before timer multiplier
   * {string} description
   */
  constructor(name, baseValue, description) {
    super(name, CARD_TYPES.ATTACK, baseValue, description);
  }
/**
   * Applies damage to the enemy.
   * effectValue is already scaled by the timer multiplier before this is called.
   * {Player} player
   * {BaseEnemy} enemy
   * {number} effectValue - Final damage after timer scaling
   * {{ damage: number, message: string }}
   */
  apply(player, enemy, effectValue) {
    enemy.takeDamage(effectValue);
    return { damage: effectValue, message: `${this.name} deals ${effectValue} damage!` };
  }
}
/**
 * Available attack card factories organized by world level.
 * Each entry is a function that returns a new AttackCard instance.
 */
export const ATTACK_CARDS = {
  1: [
    () => new AttackCard('Quick Strike', 12, 'A fast attack dealing moderate damage'),
    () => new AttackCard('Kick', 15, 'A strong kick dealing good damage'),
  ],
  2: [
    () => new AttackCard('Precise Lightning', 18, 'A precise lightning bolt'),
    () => new AttackCard('Poison', 10, 'Poison attack with lingering effect'),
  ],
  3: [
    () => new AttackCard('Lightning Explosion', 25, 'A massive lightning explosion'),
    () => new AttackCard('Fire Attack', 22, 'A powerful fire attack'),
  ],
};
/**
 * Returns a random attack card appropriate for the given world level.
 * Falls back to world 1 cards if worldLevel is not found.
 * {number} worldLevel
 * {AttackCard}
 */
export function getRandomAttackCard(worldLevel = 1) {
  const cards = ATTACK_CARDS[worldLevel] || ATTACK_CARDS[1];
  const factory = cards[Math.floor(Math.random() * cards.length)];
  return factory();
}
