import BaseEnemy from '../BaseEnemy.js';

export default class Slime extends BaseEnemy {
  constructor() {
    super('Slime', 30, 5, 'Sticky Hit', 'Reduces player card effectiveness by 10% for one turn');
    this.color = 0x44cc44;
  }

  useSkill(player, combatContext) {
    combatContext.cardEffectivenessModifier = 0.9;
    return { message: 'Slime uses Sticky Hit! Card effectiveness reduced by 10%!' };
  }
}
