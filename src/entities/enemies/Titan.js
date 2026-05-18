import BaseEnemy from '../BaseEnemy.js';

export default class Titan extends BaseEnemy {
  constructor() {
    super('Titan', 120, 15, 'Earth Smash', 'Deals heavy damage but has a delay');
    this.isBoss = true;
    this.color = 0x664400;
    this.charging = false;
  }

  useSkill(player, combatContext) {
    if (!this.charging) {
      this.charging = true;
      combatContext.enemySkipAttack = true;
      return { message: 'Titan is charging Earth Smash... Brace yourself!' };
    }
    this.charging = false;
    const heavyDamage = 30;
    player.takeDamage(heavyDamage);
    return { message: `Titan unleashes Earth Smash! ${heavyDamage} devastating damage!` };
  }

  getAction() {
    if (this.charging) return 'skill';
    return Math.random() < 0.4 ? 'skill' : 'attack';
  }
}
