import BaseEnemy from '../BaseEnemy.js';

export default class CardThief extends BaseEnemy {
  constructor() {
    super('Card Thief', 25, 4, 'Steal Card', 'Locks one card until the player answers correctly');
    this.color = 0xaa8800;
  }

  useSkill(player, combatContext) {
    if (combatContext.playerDeck && combatContext.playerDeck.length > 0) {
      const idx = Math.floor(Math.random() * combatContext.playerDeck.length);
      combatContext.lockedCardIndex = idx;
      return { message: `Card Thief steals "${combatContext.playerDeck[idx].name}"! Answer correctly to unlock!` };
    }
    return { message: 'Card Thief finds nothing to steal!' };
  }
}
