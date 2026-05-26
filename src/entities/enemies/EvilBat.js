/**
 * EvilBat.js
 * Fast, low-HP enemy that punishes the timer system directly.
 * Low attack but its skill can dramatically shorten available response time.
 *
 * Skill — Sonic Screech:
 *   Reduces the effective timer by 2000ms (2 seconds) for the current turn.
 *   Sets combatContext.timerReduction = 2000, which CombatScene subtracts
 *   from the elapsed time calculation, making the timer zone worse faster.
 *   Forces quick thinking under even tighter time pressure.
 *
 * World: Castle (World 2)
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class EvilBat extends BaseEnemy {
  constructor() {
    super('Evil Bat', 50, 6, 'Sonic Screech', 'Reduces timer duration by 2 seconds');
    this.color = 0x550055; // Dark purple
  }

  /**
   * Sonic Screech: cuts 2 seconds from the effective timer this turn.
   * combatContext.timerReduction is added to elapsed time in CombatScene,
   * pushing the player toward the RED or timeout zone faster.
   * @param {Player} player
   * @param {object} combatContext
   */
  useSkill(player, combatContext) {
    combatContext.timerReduction = 2000;
    return { message: 'Evil Bat uses Sonic Screech! Timer reduced by 2 seconds!' };
  }
}
