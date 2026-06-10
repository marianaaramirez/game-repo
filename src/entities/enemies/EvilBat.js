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
import evilBatIdle from '../../assets/Enemy_sprites/EvilBat/EvilBat_Idle.png';
import evilBatAttack from '../../assets/Enemy_sprites/EvilBat/EvilBat_Attack.png';
import evilBatHurt from '../../assets/Enemy_sprites/EvilBat/EvilBat_Hurt.png';
import evilBatDeath from '../../assets/Enemy_sprites/EvilBat/EvilBat_Death.png';

export default class EvilBat extends BaseEnemy {
  constructor() {
    super('Evil Bat', 70, 7, 'Sonic Screech', 'Reduces timer duration by 2 seconds');
    //this.color = 0x550055; // Dark purple

    this.spriteConfig = {
      key: 'evilBat',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: evilBatIdle,
        Attack: evilBatAttack,
        Hurt: evilBatHurt,
        Death: evilBatDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 6, loop: true },
        Attack: { start: 12, end: 17, fps: 10, loop: false },
        Hurt: { start: 8, end: 11, fps: 6, loop: false },
        Death: { start: 20, end: 29, fps: 4, loop: false }
      }
    };
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
