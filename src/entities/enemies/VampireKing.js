import BaseEnemy from '../BaseEnemy.js';

export default class VampireKing extends BaseEnemy {
  constructor() {
    super('Vampire King', 80, 12, 'Royal Command', 'Performs two actions in one turn');
    this.isBoss = true;
    this.color = 0xcc0000;
  }

  useSkill(player, combatContext) {
    combatContext.enemyDoubleAction = true;
    return { message: 'Vampire King uses Royal Command! Two attacks this turn!' };
  }
}
