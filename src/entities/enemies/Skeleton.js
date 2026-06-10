/**
 * Skeleton.js
 * Mid-tier enemy that bypasses the player's defense cards.
 *
 * Skill — Bone Throw:
 *   Deals 5 points of DIRECT damage to the player, completely ignoring
 *   any active defense value. Called directly on player.takeDamage()
 *   inside useSkill(), so defense cards cannot block it.
 *   Teaches players they cannot rely solely on defense strategies.
 *
 * World: Castle (World 2)
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';
import skeletonIdle from '../../assets/Enemy_sprites/Skeleton/Skeleton_Idle.png';
import skeletonAttack from '../../assets/Enemy_sprites/Skeleton/Skeleton_Attack.png';
import skeletonHurt from '../../assets/Enemy_sprites/Skeleton/Skeleton_Hurt.png';
import skeletonDeath from '../../assets/Enemy_sprites/Skeleton/Skeleton_Death.png';

export default class Skeleton extends BaseEnemy {
  constructor() {
    super('Skeleton', 95, 9, 'Bone Throw', 'Deals extra damage ignoring defense');
    //this.color = 0xcccccc; // Light gray / bone white

    this.spriteConfig = {
      key: 'skeleton',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: skeletonIdle,
        Attack: skeletonAttack,
        Hurt: skeletonHurt,
        Death: skeletonDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 6, loop: true },
        Attack: { start: 18, end: 26, fps: 7, loop: false },
        Hurt: { start: 8, end: 11, fps: 6, loop: false },
        Death: { start: 12, end: 17, fps: 4, loop: false }
      }
    };
  }

  /**
   * Bone Throw: applies 5 direct damage to the player, bypassing defense.
   * Damage is applied immediately inside useSkill rather than going through
   * the normal CombatSystem.enemyTurn() flow.
   * {Player} player
   * {object} combatContext
   */
  useSkill(player, combatContext) {
    const boneDamage = 5;
    player.takeDamage(boneDamage);
    return { message: `Skeleton uses Bone Throw! ${boneDamage} direct damage ignoring defense!` };
  }
}
