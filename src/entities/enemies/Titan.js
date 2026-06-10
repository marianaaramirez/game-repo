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
import titanIdle from '../../assets/Enemy_sprites/Titan/Titan_Idle.png';
import titanAttack from '../../assets/Enemy_sprites/Titan/Titan_Attack.png';
import titanHurt from '../../assets/Enemy_sprites/Titan/Titan_Hurt.png';
import titanDeath from '../../assets/Enemy_sprites/Titan/Titan_Death.png';

export default class Titan extends BaseEnemy {
  constructor() {
    super('Titan', 220, 17, 'Earth Smash', 'Deals heavy damage but has a delay');
    this.isBoss   = true;
    //this.color    = 0x664400; // Brown / earth tone
    this.charging = false;    // True while preparing Earth Smash

    this.spriteConfig = {
      key: 'titan',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: titanIdle,
        Attack: titanAttack,
        Hurt: titanHurt,
        Death: titanDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 6, loop: true },
        Attack: { start: 16, end: 23, fps: 8, loop: false },
        Hurt: { start: 12, end: 17, fps: 10, loop: false },
        Death: { start: 16, end: 23, fps: 4, loop: false }
      }
    };
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
