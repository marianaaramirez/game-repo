import BaseCard, { CARD_TYPES } from './BaseCard.js';

export default class AttackCard extends BaseCard {
  constructor(name, baseValue, description) {
    super(name, CARD_TYPES.ATTACK, baseValue, description);
  }

  apply(player, enemy, effectValue) {
    enemy.takeDamage(effectValue);
    return { damage: effectValue, message: `${this.name} deals ${effectValue} damage!` };
  }
}

export const ATTACK_CARDS = {
  1: [
    () => new AttackCard('Quick Strike', 12, 'A fast attack dealing moderate damage'),
    () => new AttackCard('Kick', 15, 'A strong kick dealing good damage'),
  ],
  2: [
    () => new AttackCard('Precise Lightning', 18, 'A precise lightning bolt'),
    () => new AttackCard('Poison', 10, 'Poison attack with lingering effect'),
  ],
  3: [
    () => new AttackCard('Lightning Explosion', 25, 'A massive lightning explosion'),
    () => new AttackCard('Fire Attack', 22, 'A powerful fire attack'),
  ],
};

export function getRandomAttackCard(worldLevel = 1) {
  const cards = ATTACK_CARDS[worldLevel] || ATTACK_CARDS[1];
  const factory = cards[Math.floor(Math.random() * cards.length)];
  return factory();
}
