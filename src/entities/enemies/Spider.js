import BaseEnemy from '../BaseEnemy.js';

export default class Spider extends BaseEnemy {
  constructor() {
    super('Spider', 25, 7, 'Web Trap', 'Disables one random card for the next turn');
    this.color = 0x663399;
  }

  useSkill(player, combatContext) {
    if (combatContext.playerDeck && combatContext.playerDeck.length > 0) {
      const idx = Math.floor(Math.random() * combatContext.playerDeck.length);
      combatContext.disabledCardIndex = idx;
      return { message: `Spider uses Web Trap! Card "${combatContext.playerDeck[idx].name}" is disabled!` };
    }
    return { message: 'Spider tries Web Trap but has no target!' };
  }
}
