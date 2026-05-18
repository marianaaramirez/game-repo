import BaseCard, { CARD_TYPES } from './BaseCard.js';

export default class DefenseCard extends BaseCard {
  constructor(name, baseValue, description) {
    super(name, CARD_TYPES.DEFENSE, baseValue, description);
  }

  apply(player, enemy, effectValue) {
    return { defense: effectValue, message: `${this.name} blocks ${effectValue} damage!` };
  }
}

export const DEFENSE_CARDS = {
  1: [
    () => new DefenseCard('Dodge', 10, 'Reduces damage based on the result'),
    () => new DefenseCard('Shield', 15, 'Blocks damage equal to the result'),
  ],
  2: [
    () => new DefenseCard('Barrier Defense', 20, 'Blocks damage equal to result x 1.5'),
  ],
  3: [
    () => new DefenseCard('Counterattack', 18, 'Returns damage if you answer quickly'),
  ],
};

export function getRandomDefenseCard(worldLevel = 1) {
  const cards = DEFENSE_CARDS[worldLevel] || DEFENSE_CARDS[1];
  const factory = cards[Math.floor(Math.random() * cards.length)];
  return factory();
}
