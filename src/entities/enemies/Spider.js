/**
 * Spider.js
 * Unpredictable enemy that disrupts the player's deck selection strategy.
 *
 * Skill — Web Trap:
 *   Randomly disables one card in the player's active deck for the next turn.
 *   The disabled card index is stored in combatContext.disabledCardIndex.
 *   CombatScene reads this to gray out the card and prevent selection.
 *   Forces the player to adapt their strategy on the fly.
 *
 * World: Ancient Temple (World 1)
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class Spider extends BaseEnemy {
  constructor() {
    super('Spider', 55, 7, 'Web Trap', 'Disables one random card for the next turn');
    this.color = 0x663399; // Purple
  }

  /**
   * Web Trap: picks a random card from the player's active deck and disables it.
   * If the deck is empty, the skill has no effect.
   * {Player} player
   * {object} combatContext - Must contain playerDeck array
   */
  useSkill(player, combatContext) {
    if (combatContext.playerDeck && combatContext.playerDeck.length > 0) {
      const idx = Math.floor(Math.random() * combatContext.playerDeck.length);
      combatContext.disabledCardIndex = idx;
      return { message: `Spider uses Web Trap! Card "${combatContext.playerDeck[idx].name}" is disabled!` };
    }
    return { message: 'Spider tries Web Trap but has no target!' };
  }
}
