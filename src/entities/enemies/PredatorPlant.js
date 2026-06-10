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
import predatorPlantIdle from '../../assets/Enemy_sprites/PredatorPlant/PredatorPlant_Idle.png';
import predatorPlantAttack from '../../assets/Enemy_sprites/PredatorPlant/PredatorPlant_Attack.png';
import predatorPlantHurt from '../../assets/Enemy_sprites/PredatorPlant/PredatorPlant_Hurt.png';
import predatorPlantDeath from '../../assets/Enemy_sprites/PredatorPlant/PredatorPlant_Death.png';

export default class PredatorPlant extends BaseEnemy {
  constructor() {
    super('Predator Plant', 90, 10, 'Quick Strike', 'Attacks before the player if time is low');
    //this.color = 0x22aa22; // Dark green
    this.spriteConfig = {
      key: 'predatorPlant',
      frameWidth: 64,
      frameHeight: 64,
      row: 2,
      framesPerRow: 4,

      assets: {
        Idle: predatorPlantIdle,
        Attack: predatorPlantAttack,
        Hurt: predatorPlantHurt,
        Death: predatorPlantDeath
      },

      anims: {
        Idle: { start: 8, end: 11, fps: 6, loop: true },
        Attack: { start: 14, end: 20, fps: 7, loop: false },
        Hurt: { start: 10, end: 14, fps: 8, loop: false },
        Death: { start: 20, end: 29, fps: 4, loop: false }
      }
    };
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
