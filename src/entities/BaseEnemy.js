import BaseEntity from './BaseEntity.js';

export default class BaseEnemy extends BaseEntity {
  constructor(name, hp, attackPower, skillName, skillDesc) {
    super(name, hp, attackPower);
    this.skillName = skillName;
    this.skillDescription = skillDesc;
    this.isBoss = false;
    this.color = 0xff4444;
  }

  useSkill(player, combatContext) {
    return null;
  }

  getAction() {
    const useSkillChance = Math.random();
    if (useSkillChance < 0.3) {
      return 'skill';
    }
    return 'attack';
  }
}
