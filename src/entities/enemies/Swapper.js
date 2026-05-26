/**
 * Swapper.js
 * Special trap enemy that appears from TRAP chest encounters.
 * Low combat stats — the disruption comes from its card-swapping skill.
 *
 * Skill — Chaos Swap:
 *   Sets combatContext.swapRandomCard = true.
 *   CombatScene reads this flag and replaces one random card in the
 *   player's active deck with a random card of the same type, temporarily
 *   disrupting the player's planned strategy.
 *   Unlike CardThief, the swap is temporary and resolves at end of combat.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class Swapper extends BaseEnemy {
  constructor() {
    super('Swapper', 50, 4, 'Chaos Swap', 'Replaces one card with a random one temporarily');
    this.color = 0x00aacc; // Cyan
  }

  /**
   * Chaos Swap: flags the combat context to swap a random player card.
   * CombatScene handles the actual card replacement when it reads this flag.
   * @param {Player} player
   * @param {object} combatContext
   */
  useSkill(player, combatContext) {
    combatContext.swapRandomCard = true;
    return { message: 'Swapper uses Chaos Swap! One of your cards has been replaced!' };
  }
}
