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

export default class BoneMage extends BaseEnemy {
  constructor() {
    super('Bone Mage', 150, 10, 'Double Action', 'Increases enemy damage for one turn');
    this.isBoss = true;
    this.color = 0x8844aa; // Purple
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
