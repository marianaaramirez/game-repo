/**
 * CardThief.js
 * Special trap enemy that appears from TRAP chest encounters.
 * Low combat stats — the real threat is its card-locking skill.
 *
 * Skill — Steal Card:
 *   Locks a random card in the player's active deck by setting
 *   combatContext.lockedCardIndex. The locked card is grayed out
 *   and unselectable in CombatScene until the player answers a
 *   math problem correctly, which unlocks it.
 *   Simulates the feeling of having a resource stolen mid-combat.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';

export default class CardThief extends BaseEnemy {
  constructor() {
    super('Card Thief', 70, 4, 'Steal Card', 'Locks one card until the player answers correctly');
    this.color = 0xaa8800; // Gold / amber
  }

  /**
   * Steal Card: randomly locks one card in the player's active deck.
   * The locked card index is stored in combatContext.lockedCardIndex.
   * CombatScene prevents selection of that card until unlocked.
   * @param {Player} player
   * @param {object} combatContext - Must contain playerDeck array
   */
  useSkill(player, combatContext) {
    if (combatContext.playerDeck && combatContext.playerDeck.length > 0) {
      const idx = Math.floor(Math.random() * combatContext.playerDeck.length);
      combatContext.lockedCardIndex = idx;
      return { message: `Card Thief steals "${combatContext.playerDeck[idx].name}"! Answer correctly to unlock!` };
    }
    return { message: 'Card Thief finds nothing to steal!' };
  }
}
