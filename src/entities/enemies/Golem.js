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
import golemIdle from '../../assets/Enemy_sprites/Golem/Golem_Idle.png';
import golemAttack from '../../assets/Enemy_sprites/Golem/Golem_Attack.png';
import golemHurt from '../../assets/Enemy_sprites/Golem/Golem_Hurt.png';
import golemDeath from '../../assets/Enemy_sprites/Golem/Golem_Death.png';

export default class Golem extends BaseEnemy {
  constructor() {
    super('Golem', 120, 9, 'Stone Shield', 'Reduces incoming damage by 50% for one turn');
    //this.color       = 0x888888; // Gray
    this.shieldActive = false;   // True while Stone Shield is active

    this.spriteConfig = {
      key: 'golem',
      frameWidth: 64,
      frameHeight: 64,
      row: 2,
      framesPerRow: 6,

      assets: {
        Idle: golemIdle,
        Attack: golemAttack,
        Hurt: golemHurt,
        Death: golemDeath
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
