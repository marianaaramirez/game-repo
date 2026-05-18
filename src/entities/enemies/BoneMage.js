import BaseEnemy from '../BaseEnemy.js';

export default class BoneMage extends BaseEnemy {
  constructor() {
    super('Bone Mage', 70, 10, 'Double Action', 'Increases enemy damage for one turn');
    this.isBoss = true;
    this.color = 0x8844aa;
  }

  useSkill(player, combatContext) {
    combatContext.enemyDamageBoost = 2.0;
    return { message: 'Bone Mage uses Double Action! Next attack deals double damage!' };
  }
}
