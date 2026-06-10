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
import cardThiefIdle from '../../assets/Enemy_sprites/CardThief/CardThief_Idle.png';
import cardThiefAttack from '../../assets/Enemy_sprites/CardThief/CardThief_Attack.png';
import cardThiefHurt from '../../assets/Enemy_sprites/CardThief/CardThief_Hurt.png';
import cardThiefDeath from '../../assets/Enemy_sprites/CardThief/CardThief_Death.png';

export default class CardThief extends BaseEnemy {
  constructor() {
    super('Card Thief', 70, 5, 'Steal Card', 'Locks one card until the player answers correctly');
    //this.color = 0xaa8800; // Gold / amber

    this.spriteConfig = {
      key: 'cardThief',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: cardThiefIdle,
        Attack: cardThiefAttack,
        Hurt: cardThiefHurt,
        Death: cardThiefDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 8, loop: true },
        Attack: { start: 10, end: 14, fps: 6, loop: false },
        Hurt: { start: 8, end: 11, fps: 8, loop: false },
        Death: { start: 12, end: 17, fps: 4, loop: false }
      }
    };
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
      combatContext.lockedCard = combatContext.playerDeck[idx];
      return { message: `Card Thief steals "${combatContext.playerDeck[idx].name}"! Answer correctly to unlock!` };
    }
    return { message: 'Card Thief finds nothing to steal!' };
  }
}
