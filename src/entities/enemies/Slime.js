/**
 * Slime.js
 * Introductory enemy designed to teach core combat mechanics.
 * Low HP and damage make it the easiest encounter in the game.
 *
 * Skill — Sticky Hit:
 *   Sets cardEffectivenessModifier to 0.9, reducing the player's
 *   card effect by 10% for the current turn. Teaches the player
 *   that enemy skills can interfere with card efficiency.
 *
 * World: Ancient Temple (World 1)
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class Slime extends BaseEnemy {
  constructor() {
    super('Slime', 80, 5, 'Sticky Hit', 'Reduces player card effectiveness by 10% for one turn');
    this.color = 0x44cc44; // Green
  }
  /**
   * Sticky Hit: reduces the effectiveness of the player's next card by 10%.
   * Modifies combatContext.cardEffectivenessModifier which CombatScene reads
   * when calculating the final effectValue.
   * {Player} player
   * {object} combatContext
   */
  useSkill(player, combatContext) {
    combatContext.cardEffectivenessModifier = 0.9;
    return { message: 'Slime uses Sticky Hit! Card effectiveness reduced by 10%!' };
  }
}
