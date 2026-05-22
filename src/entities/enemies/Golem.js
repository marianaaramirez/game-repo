/**
 * Golem.js
 * High-defense enemy that punishes players who don't use attack cards wisely.
 * High HP forces sustained damage across multiple turns.
 *
 * Skill — Stone Shield:
 *   Activates a one-turn shield that halves all incoming damage.
 *   The shield is stored as this.shieldActive and consumed inside takeDamage().
 *   Teaches players to anticipate and plan card usage around enemy defenses.
 *
 * World: Ancient Temple (World 1)
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class Golem extends BaseEnemy {
  constructor() {
    super('Golem', 60, 8, 'Stone Shield', 'Reduces incoming damage by 50% for one turn');
    this.color       = 0x888888; // Gray
    this.shieldActive = false;   // True while Stone Shield is active
  }

  /**
   * Stone Shield: activates the shield flag for one turn.
   * The actual damage reduction happens inside takeDamage().
   * @param {Player} player
   * @param {object} combatContext
   */
  useSkill(player, combatContext) {
    this.shieldActive = true;
    combatContext.enemyDamageReduction = 0.5;
    return { message: 'Golem uses Stone Shield! Incoming damage reduced by 50%!' };
  }

  /**
   * Overrides BaseEntity.takeDamage to apply Stone Shield reduction.
   * If the shield is active, damage is halved and the shield is consumed.
   * @param {number} amount
   * @returns {boolean} True if the Golem died
   */
  takeDamage(amount) {
    if (this.shieldActive) {
      amount = Math.round(amount * 0.5); // Shield absorbs 50%
      this.shieldActive = false;         // Shield consumed after one hit
    }
    return super.takeDamage(amount);
  }
}
