/**
 * BoneMage.js
 * Boss of World 2 (Castle). Balanced difficulty with a damage spike mechanic.
 *
 * Skill — Double Action:
 *   Sets enemyDamageBoost = 2.0 in combat context.
 *   CombatScene multiplies the enemy's attackPower by this value
 *   when calculating the next attack, effectively doubling the damage.
 *   After the attack resolves the boost resets to 1.0.
 *   Players must use high-value defense cards immediately after this skill.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';
import boneMageIdle from '../../assets/Enemy_sprites/BoneMage/BoneMage_Idle.png';
import boneMageAttack from '../../assets/Enemy_sprites/BoneMage/BoneMage_Attack.png';
import boneMageHurt from '../../assets/Enemy_sprites/BoneMage/BoneMage_Hurt.png';
import boneMageDeath from '../../assets/Enemy_sprites/BoneMage/BoneMage_Death.png';

export default class BoneMage extends BaseEnemy {
  constructor() {
    super('Bone Mage', 150, 11, 'Double Action', 'Increases enemy damage for one turn');
    this.isBoss = true;
    //this.color = 0x8844aa; // Purple

    this.spriteConfig = {
      key: 'boneMage',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: boneMageIdle,
        Attack: boneMageAttack,
        Hurt: boneMageHurt,
        Death: boneMageDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 8, loop: true },
        Attack: { start: 16, end: 23, fps: 8, loop: false },
        Hurt: { start: 8, end: 11, fps: 8, loop: false },
        Death: { start: 20, end: 29, fps: 4, loop: false }
      }
    };
  }
  /**
   * Double Action: boosts the enemy's next attack to deal 2x damage.
   * combatContext.enemyDamageBoost is multiplied against attackPower in CombatScene.
   * {Player} player
   * {object} combatContext
   */
  useSkill(player, combatContext) {
    combatContext.enemyDamageBoost = 2.0;
    return { message: 'Bone Mage uses Double Action! Next attack deals double damage!' };
  }
}
