import BaseEnemy from '../BaseEnemy.js';

export default class Swapper extends BaseEnemy {
  constructor() {
    super('Swapper', 25, 4, 'Chaos Swap', 'Replaces one card with a random one temporarily');
    this.color = 0x00aacc;
  }

  useSkill(player, combatContext) {
    combatContext.swapRandomCard = true;
    return { message: 'Swapper uses Chaos Swap! One of your cards has been replaced!' };
  }
}
