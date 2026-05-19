/**
 * DefenseCard.js
 * Concrete card class for defense-type cards.
 * When activated, sets an active defense value that absorbs incoming enemy damage
 * during the enemy's turn that immediately follows.
 *
 * Available defense cards per world:
 *   World 1 (Ancient Temple): Dodge (10), Shield (15)
 *   World 2 (Castle):         Barrier Defense (20)
 *   World 3 (Wasteland):      Counterattack (18)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseCard, { CARD_TYPES } from './BaseCard.js';

export default class DefenseCard extends BaseCard {
    /**
   * {string} name       - Card display name
   * {number} baseValue  - Base defense points before timer multiplier
   * {string} description
   */
  constructor(name, baseValue, description) {
    super(name, CARD_TYPES.DEFENSE, baseValue, description);
  }
  /**
   * Returns the defense value to store as activeDefense in CombatScene.
   * The returned value is used by CombatSystem.enemyTurn() to reduce damage.
   * {Player} player
   * {BaseEnemy} enemy
   * {number} effectValue - Final defense after timer scaling
   * { defense: number, message: string }
   */
  apply(player, enemy, effectValue) {
    return { defense: effectValue, message: `${this.name} blocks ${effectValue} damage!` };
  }
}
/**
 * Available defense card factories organized by world level.
 */
export const DEFENSE_CARDS = {
  1: [
    () => new DefenseCard('Dodge', 10, 'Reduces damage based on the result'),
    () => new DefenseCard('Shield', 15, 'Blocks damage equal to the result'),
  ],
  2: [
    () => new DefenseCard('Barrier Defense', 20, 'Blocks damage equal to result x 1.5'),
  ],
  3: [
    () => new DefenseCard('Counterattack', 18, 'Returns damage if you answer quickly'),
  ],
};
/**
 * Returns a random defense card for the given world level.
 * {number} worldLevel
 * {DefenseCard}
 */
export function getRandomDefenseCard(worldLevel = 1) {
  const cards = DEFENSE_CARDS[worldLevel] || DEFENSE_CARDS[1];
  const factory = cards[Math.floor(Math.random() * cards.length)];
  return factory();
}
