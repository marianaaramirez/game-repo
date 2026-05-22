/**
 * AttackCard.js
 * Concrete card class for attack-type cards.
 * When activated (math problem answered correctly), deals damage to the enemy
 * scaled by the timer multiplier.
 *
 * Special mechanics (the `special` field):
 *   'none'      — plain damage
 *   'lifesteal' — deals damage AND heals the player for half the damage
 *   'reckless'  — deals high damage but the player takes a small recoil hit
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */
import BaseCard, { CARD_TYPES } from './BaseCard.js';

// Fixed recoil damage taken by the player when using a 'reckless' card
const RECKLESS_RECOIL = 4;

export default class AttackCard extends BaseCard {
  /**
   * @param {string} name        - Card display name
   * @param {number} baseValue   - Base damage before timer multiplier
   * @param {string} description
   * @param {string} special     - Special mechanic: 'none' | 'lifesteal' | 'reckless'
   */
  constructor(name, baseValue, description, special = 'none') {
    super(name, CARD_TYPES.ATTACK, baseValue, description);
    this.special = special;
  }

  /**
   * Applies damage to the enemy, plus any special side-effect.
   * effectValue is already scaled by the timer multiplier before this is called.
   * @param {Player}    player
   * @param {BaseEnemy} enemy
   * @param {number}    effectValue - Final damage after timer scaling
   * @returns {{ damage: number, message: string }}
   */
  apply(player, enemy, effectValue) {
    enemy.takeDamage(effectValue);
    let message = `${this.name} deals ${effectValue} damage!`;

    if (this.special === 'lifesteal') {
      // Heal the player for half of the damage dealt
      const healed = Math.round(effectValue * 0.5);
      player.heal(healed);
      message += ` Drained ${healed} HP!`;
    } else if (this.special === 'reckless') {
      // Player takes recoil — guarded so it can never be lethal
      player.hp = Math.max(1, player.hp - RECKLESS_RECOIL);
      message += ` (Recoil ${RECKLESS_RECOIL})`;
    }

    return { damage: effectValue, message };
  }
}

/**
 * Available attack card factories organized by world level.
 * Each entry is a function that returns a fresh AttackCard instance.
 */
export const ATTACK_CARDS = {
  1: [
    () => new AttackCard('Quick Jab', 10, 'A fast, light strike'),
    () => new AttackCard('Temple Strike', 16, 'A solid hit on the enemy'),
    () => new AttackCard('Vampiric Bite', 14, 'Deals damage and heals you', 'lifesteal'),
    () => new AttackCard('Reckless Swing', 22, 'Big damage, small recoil', 'reckless'),
  ],
  2: [
    () => new AttackCard('Knight Slash', 18, 'A trained sword strike'),
    () => new AttackCard('Royal Lance', 24, 'A piercing lance thrust'),
    () => new AttackCard('Blood Saber', 20, 'Damages the enemy and heals you', 'lifesteal'),
    () => new AttackCard('Berserk Charge', 32, 'Huge damage with recoil', 'reckless'),
  ],
  3: [
    () => new AttackCard('Plasma Shot', 26, 'A burst of plasma energy'),
    () => new AttackCard('Meteor Strike', 34, 'Calls down a meteor'),
    () => new AttackCard('Soul Drain', 28, 'Drains the enemy life force', 'lifesteal'),
    () => new AttackCard('Doom Blast', 44, 'Devastating blast with recoil', 'reckless'),
  ],
};

/**
 * Returns a random attack card appropriate for the given world level.
 * Falls back to world 1 cards if worldLevel is not found.
 * @param {number} worldLevel
 * @returns {AttackCard}
 */
export function getRandomAttackCard(worldLevel = 1) {
  const cards   = ATTACK_CARDS[worldLevel] || ATTACK_CARDS[1];
  const factory = cards[Math.floor(Math.random() * cards.length)];
  return factory();
}
