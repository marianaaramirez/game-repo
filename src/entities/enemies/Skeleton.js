import BaseEnemy from '../BaseEnemy.js';

export default class Skeleton extends BaseEnemy {
  constructor() {
    super('Skeleton', 40, 8, 'Bone Throw', 'Deals extra damage ignoring defense');
    this.color = 0xcccccc;
  }

  useSkill(player, combatContext) {
    const boneDamage = 5;
    player.takeDamage(boneDamage);
    return { message: `Skeleton uses Bone Throw! ${boneDamage} direct damage ignoring defense!` };
  }
}
