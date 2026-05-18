import BaseEnemy from '../BaseEnemy.js';

export default class Golem extends BaseEnemy {
  constructor() {
    super('Golem', 60, 8, 'Stone Shield', 'Reduces incoming damage by 50% for one turn');
    this.color = 0x888888;
    this.shieldActive = false;
  }

  useSkill(player, combatContext) {
    this.shieldActive = true;
    combatContext.enemyDamageReduction = 0.5;
    return { message: 'Golem uses Stone Shield! Incoming damage reduced by 50%!' };
  }

  takeDamage(amount) {
    if (this.shieldActive) {
      amount = Math.round(amount * 0.5);
      this.shieldActive = false;
    }
    return super.takeDamage(amount);
  }
}
