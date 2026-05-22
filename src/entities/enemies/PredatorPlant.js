/**
 * PredatorPlant.js
 * Fast enemy that adds pressure to the timer system.
 * Medium HP and high attack make it dangerous for slow responders.
 *
 * Skill — Quick Strike:
 *   Sets enemyStrikesFirst = true in combat context.
 *   CombatScene reads this flag and applies the enemy attack before
 *   the player's card effect if the player is in the RED timer zone.
 *   Directly punishes slow math answers.
 *
 * World: Ancient Temple (World 1)
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class PredatorPlant extends BaseEnemy {
  constructor() {
    super('Predator Plant', 35, 9, 'Quick Strike', 'Attacks before the player if time is low');
    this.color = 0x22aa22; // Dark green
  }

  /**
   * Quick Strike: signals that the enemy should act before the player this turn.
   * CombatScene checks combatContext.enemyStrikesFirst when applying effects.
   * @param {Player} player
   * @param {object} combatContext
   */
  useSkill(player, combatContext) {
    combatContext.enemyStrikesFirst = true;
    return { message: 'Predator Plant readies Quick Strike! Answer fast or take damage first!' };
  }
}
