import BaseEnemy from '../BaseEnemy.js';

export default class EvilBat extends BaseEnemy {
  constructor() {
    super('Evil Bat', 20, 6, 'Sonic Screech', 'Reduces timer duration by 2 seconds');
    this.color = 0x550055;
  }

  useSkill(player, combatContext) {
    combatContext.timerReduction = 2000;
    return { message: 'Evil Bat uses Sonic Screech! Timer reduced by 2 seconds!' };
  }
}
