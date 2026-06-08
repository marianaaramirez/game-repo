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

export default class VampireKing extends BaseEnemy {
  constructor() {
    super('Vampire King', 170, 14, 'Royal Command', 'Performs two actions in one turn');
    this.isBoss = true;    // Marks as boss for UI display (red BOSS label)
    this.color  = 0xcc0000; // Dark red
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
