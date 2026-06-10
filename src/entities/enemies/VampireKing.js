/**
 * VampireKing.js
 * Boss of World 1 (Ancient Temple). Fast and aggressive.
 * Higher HP and attack than normal enemies, requiring sustained effort.
 *
 * Skill — Royal Command:
 *   Sets enemyDoubleAction = true in combat context.
 *   CombatScene reads this flag after the normal enemy attack and
 *   applies a second full attack to the player in the same turn.
 *   Forces the player to prioritize defense cards before this boss acts.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';
import vampireKingIdle from '../../assets/Enemy_sprites/VampireKing/VampireKing_Idle.png';
import vampireKingAttack from '../../assets/Enemy_sprites/VampireKing/VampireKing_Attack.png';
import vampireKingHurt from '../../assets/Enemy_sprites/VampireKing/VampireKing_Hurt.png';
import vampireKingDeath from '../../assets/Enemy_sprites/VampireKing/VampireKing_Death.png';

export default class VampireKing extends BaseEnemy {
  constructor() {
    super('Vampire King', 170, 14, 'Royal Command', 'Performs two actions in one turn');
    this.isBoss = true;    // Marks as boss for UI display (red BOSS label)
    //this.color  = 0xcc0000; // Dark red
    this.spriteConfig = {
      key: 'vampireKing',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: vampireKingIdle,
        Attack: vampireKingAttack,
        Hurt: vampireKingHurt,
        Death: vampireKingDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 6, loop: true },
        Attack: { start: 24, end: 35, fps: 8, loop: false },
        Hurt: { start: 8, end: 11, fps: 6, loop: false },
        Death: { start: 20, end: 29, fps: 4, loop: false }
      }
    };
  }

  /**
   * Royal Command: flags the combat context to execute a second attack this turn.
   * CombatScene applies the extra attack after the normal enemy attack resolves.
   * {Player} player
   * {object} combatContext
   */
  useSkill(player, combatContext) {
    combatContext.enemyDoubleAction = true;
    return { message: 'Vampire King uses Royal Command! Two attacks this turn!' };
  }
}
