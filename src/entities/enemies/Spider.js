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
import spiderIdle from '../../assets/Enemy_sprites/Spider/Spider_Idle.png';
import spiderAttack from '../../assets/Enemy_sprites/Spider/Spider_Attack.png';
import spiderHurt from '../../assets/Enemy_sprites/Spider/Spider_Hurt.png';
import spiderDeath from '../../assets/Enemy_sprites/Spider/Spider_Death.png';

export default class Spider extends BaseEnemy {
  constructor() {
    super('Spider', 75, 8, 'Web Trap', 'Disables one random card for the next turn');

    this.spriteConfig = {
      key: 'spider',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: spiderIdle,
        Attack: spiderAttack,
        Hurt: spiderHurt,
        Death: spiderDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 8, loop: true },
        Attack: { start: 16, end: 23, fps: 12, loop: false },
        Hurt: { start: 8, end: 11, fps: 10, loop: false },
        Death: { start: 18, end: 26, fps: 8, loop: false }
      }
    };
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
      combatContext.disabledCard = combatContext.playerDeck[idx];
      return { message: `Spider uses Web Trap! Card "${combatContext.playerDeck[idx].name}" is disabled!` };
    }
    return { message: 'Spider tries Web Trap but has no target!' };
  }
}
