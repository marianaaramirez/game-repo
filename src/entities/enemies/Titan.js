/**
 * Titan.js
 * Boss of World 3 (Wasteland). Highest HP in the game, tests endurance.
 *
 * Skill — Earth Smash (2-turn charge):
 *   Turn 1: Titan sets this.charging = true and skips its normal attack.
 *           The player gets a warning but takes no damage yet.
 *   Turn 2: Titan releases Earth Smash for 30 direct damage (ignores defense),
 *           then this.charging resets to false.
 *   This mechanic tests whether players can survive a predictable but massive hit
 *   by using defense or healing skill cards between the two turns.
 *
 * Overrides getAction() to force skill use while charging.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class Titan extends BaseEnemy {
  constructor() {
    super('Titan', 220, 15, 'Earth Smash', 'Deals heavy damage but has a delay');
    this.isBoss   = true;
    this.color    = 0x664400; // Brown / earth tone
    this.charging = false;    // True while preparing Earth Smash
  }

  /**
   * Earth Smash (2-turn): first call charges, second call releases.
   * On charge turn: sets enemySkipAttack so no normal damage occurs.
   * On release turn: deals 30 direct damage bypassing defense.
   * @param {Player} player
   * @param {object} combatContext
   */
  useSkill(player, combatContext) {
    if (!this.charging) {
      // Turn 1: begin charging — skip normal attack this turn
      this.charging = true;
      combatContext.enemySkipAttack = true;
      return { message: 'Titan is charging Earth Smash... Brace yourself!' };
    }
    // Turn 2: release the charge — 30 direct damage
    this.charging = false;
    const heavyDamage = 30;
    player.takeDamage(heavyDamage);
    return { message: `Titan unleashes Earth Smash! ${heavyDamage} devastating damage!` };
  }

  /**
   * Overrides base getAction to force 'skill' while Earth Smash is charging.
   * When not charging, uses skill 40% of the time (higher than base 30%).
   * @returns {'skill' | 'attack'}
   */
  getAction() {
    if (this.charging) return 'skill'; // Must release Earth Smash
    return Math.random() < 0.4 ? 'skill' : 'attack';
  }
}
