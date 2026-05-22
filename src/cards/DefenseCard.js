/**
 * DefenseCard.js
 * Concrete card class for defense-type cards.
 * When activated, sets an active defense value that absorbs incoming enemy damage
 * during the enemy's turn that immediately follows.
 *
 * Special mechanics (the `special` field):
 *   'none'    — plain block
 *   'heal'    — blocks AND heals the player for half the block value
 *   'counter' — blocks AND reflects half the block value back as damage
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseCard, { CARD_TYPES } from './BaseCard.js';

export default class DefenseCard extends BaseCard {
  /**
   * @param {string} name        - Card display name
   * @param {number} baseValue   - Base defense points before timer multiplier
   * @param {string} description
   * @param {string} special     - Special mechanic: 'none' | 'heal' | 'counter'
   */
  constructor(name, baseValue, description, special = 'none') {
    super(name, CARD_TYPES.DEFENSE, baseValue, description);
    this.special = special;
  }

  /**
   * Returns the defense value to store as activeDefense in CombatScene, and
   * applies any special side-effect (healing the player or countering the enemy).
   * @param {Player}    player
   * @param {BaseEnemy} enemy
   * @param {number}    effectValue - Final defense after timer scaling
   * @returns {{ defense: number, message: string }}
   */
  apply(player, enemy, effectValue) {
    let message = `${this.name} blocks ${effectValue} damage!`;

    if (this.special === 'heal') {
      // Restore HP equal to half of the block value
      const healed = Math.round(effectValue * 0.5);
      player.heal(healed);
      message += ` Restored ${healed} HP!`;
    } else if (this.special === 'counter') {
      // Reflect half of the block value back at the enemy as damage
      const reflected = Math.round(effectValue * 0.5);
      enemy.takeDamage(reflected);
      message += ` Countered ${reflected} damage!`;
    }

    return { defense: effectValue, message };
  }
}

/**
 * Available defense card factories organized by world level.
 */
export const DEFENSE_CARDS = {
  1: [
    () => new DefenseCard('Stone Guard', 12, 'Blocks incoming damage'),
    () => new DefenseCard('Sturdy Block', 18, 'Blocks a large amount of damage'),
    () => new DefenseCard('Healing Ward', 14, 'Blocks damage and heals you', 'heal'),
    () => new DefenseCard('Thorn Shield', 13, 'Blocks and reflects damage', 'counter'),
  ],
  2: [
    () => new DefenseCard('Iron Wall', 20, 'Blocks incoming damage'),
    () => new DefenseCard('Castle Aegis', 28, 'Blocks a heavy amount of damage'),
    () => new DefenseCard('Mending Barrier', 20, 'Blocks damage and heals you', 'heal'),
    () => new DefenseCard('Spiked Rampart', 18, 'Blocks and reflects damage', 'counter'),
  ],
  3: [
    () => new DefenseCard('Force Field', 28, 'Blocks incoming damage'),
    () => new DefenseCard('Aegis Protocol', 38, 'Blocks a massive amount of damage'),
    () => new DefenseCard('Nano Repair', 28, 'Blocks damage and heals you', 'heal'),
    () => new DefenseCard('Reflect Barrier', 26, 'Blocks and reflects damage', 'counter'),
  ],
};

/**
 * Returns a random defense card for the given world level.
 * @param {number} worldLevel
 * @returns {DefenseCard}
 */
export function getRandomDefenseCard(worldLevel = 1) {
  const cards   = DEFENSE_CARDS[worldLevel] || DEFENSE_CARDS[1];
  const factory = cards[Math.floor(Math.random() * cards.length)];
  return factory();
}
