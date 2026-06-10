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
import swapperIdle from '../../assets/Enemy_sprites/Swapper/Swapper_Idle.png';
import swapperAttack from '../../assets/Enemy_sprites/Swapper/Swapper_Attack.png';
import swapperHurt from '../../assets/Enemy_sprites/Swapper/Swapper_Hurt.png';
import swapperDeath from '../../assets/Enemy_sprites/Swapper/Swapper_Death.png';

export default class Swapper extends BaseEnemy {
  constructor() {
    super('Swapper', 70, 5, 'Chaos Swap', 'Replaces one card with a random one temporarily');
    //this.color = 0x00aacc; // Cyan

    this.spriteConfig = {
      key: 'swapper',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: swapperIdle,
        Attack: swapperAttack,
        Hurt: swapperHurt,
        Death: swapperDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 6, loop: true },
        Attack: { start: 16, end: 23, fps: 8, loop: false },
        Hurt: { start: 8, end: 11, fps: 6, loop: false },
        Death: { start: 20, end: 29, fps: 4, loop: false }
      }
    };
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
