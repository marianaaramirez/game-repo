/**
 * Slime.js
 * Introductory enemy designed to teach core combat mechanics.
 * Low HP and damage make it the easiest encounter in the game.
 *
 * Skill — Sticky Hit:
 *   Sets cardEffectivenessModifier to 0.9, reducing the player's
 *   card effect by 10% for the current turn. Teaches the player
 *   that enemy skills can interfere with card efficiency.
 *
 * World: Ancient Temple (World 1)
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEnemy from '../BaseEnemy.js';
import slimeIdle from '../../assets/Enemy_sprites/Slime/1_Slime_Idle.png';
import slimeAttack from '../../assets/Enemy_sprites/Slime/1_Slime_Attack.png';
import slimeHurt from '../../assets/Enemy_sprites/Slime/1_Slime_Hurt.png';
import slimeDeath from '../../assets/Enemy_sprites/Slime/1_Slime_Death.png';


export default class Slime extends BaseEnemy {
  constructor() {
    super('Slime', 60, 5, 'Sticky Hit', 'Reduces player card effectiveness by 10% for one turn');

    this.spriteConfig = {
      key: 'slime',
      frameWidth: 64,
      frameHeight: 64,
      row: 1,
      framesPerRow: 6,

      assets: {
        Idle: slimeIdle,
        Attack: slimeAttack,
        Hurt: slimeHurt,
        Death: slimeDeath
      },

      anims: {
        Idle: { start: 12, end: 17, fps: 10, loop: true },
        Attack: { start: 20, end: 29, fps: 6, loop: false },
        Hurt: { start: 10, end: 14, fps: 8, loop: false },
        Death: { start: 20, end: 29, fps: 4, loop: false }
      }
    };
  }
    /**
     * Sticky Hit: reduces the effectiveness of the player's next card by 10%.
     * Modifies combatContext.cardEffectivenessModifier which CombatScene reads
     * when calculating the final effectValue.
     * {Player} player
     * {object} combatContext
     */
  useSkill(player, combatContext) {
    combatContext.cardEffectivenessModifier = 0.9;
    return { message: 'Slime uses Sticky Hit! Card effectiveness reduced by 10%!' };
  }
}