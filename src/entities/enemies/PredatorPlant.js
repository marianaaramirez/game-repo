import BaseEnemy from '../BaseEnemy.js';

export default class PredatorPlant extends BaseEnemy {
  constructor() {
    super('Predator Plant', 35, 9, 'Quick Strike', 'Attacks before the player if time is low');
    this.color = 0x22aa22;
  }

  useSkill(player, combatContext) {
    combatContext.enemyStrikesFirst = true;
    return { message: 'Predator Plant readies Quick Strike! Answer fast or take damage first!' };
  }
}
