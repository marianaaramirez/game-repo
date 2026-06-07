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

export default class Skeleton extends BaseEnemy {
  constructor() {
    super('Skeleton', 95, 8, 'Bone Throw', 'Deals extra damage ignoring defense');
    this.color = 0xcccccc; // Light gray / bone white
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
