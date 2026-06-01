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
 *   'pierce'    — ignores Slime's cardEffectivenessModifier (handled in CombatScene)
 *   'crit'      — 25% chance to deal double damage
 *   'bleed'     — deals base damage AND applies bleed ticks on the enemy
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */
import BaseCard, { CARD_TYPES } from './BaseCard.js';

// Fixed recoil damage taken by the player when using a 'reckless' card
const RECKLESS_RECOIL = 4;
// 25% chance to crit, 2x damage multiplier
const CRIT_CHANCE     = 0.25;
const CRIT_MULTIPLIER = 2;

export default class AttackCard extends BaseCard {
  /**
   * @param {string} name        - Card display name
   * @param {number} baseValue   - Base damage before timer multiplier
   * @param {string} description
   * @param {string} special     - Special mechanic
   * @param {object} extra       - Special-specific config (e.g. { bleedDamage, bleedTurns })
   */
  constructor(name, baseValue, description, special = 'none', extra = {}) {
    super(name, CARD_TYPES.ATTACK, baseValue, description);
    this.special = special;
    this.extra   = extra;
  }

  /**
   * Applies damage to the enemy, plus any special side-effect.
   * effectValue is already scaled by the timer multiplier before this is called.
   */
  apply(player, enemy, effectValue) {
    let damage  = effectValue;
    let message = '';

    // Crit roll first so the damage number reflects the multiplier
    if (this.special === 'crit' && Math.random() < CRIT_CHANCE) {
      damage = damage * CRIT_MULTIPLIER;
      message = `CRITICAL! ${this.name} deals ${damage} damage!`;
    } else {
      message = `${this.name} deals ${damage} damage!`;
    }

    enemy.takeDamage(damage);

    if (this.special === 'lifesteal') {
      const healed = Math.round(damage * 0.5);
      player.heal(healed);
      message += ` Drained ${healed} HP!`;
    } else if (this.special === 'reckless') {
      player.hp = Math.max(1, player.hp - RECKLESS_RECOIL);
      message += ` (Recoil ${RECKLESS_RECOIL})`;
    } else if (this.special === 'pierce') {
      message += ` (Pierce — ignores reduction)`;
    } else if (this.special === 'bleed') {
      // Stamp bleed state directly on the enemy so CombatScene can tick it
      const bleedTurns  = this.extra.bleedTurns  || 2;
      const bleedDamage = this.extra.bleedDamage || 4;
      enemy.bleed       = bleedTurns;
      enemy.bleedDamage = bleedDamage;
      message += ` Bleeding ${bleedDamage} dmg for ${bleedTurns} turns!`;
    }

    return { damage, message };
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
    () => new AttackCard('Armor Piercer', 12, 'Pierces through enemy defenses', 'pierce'),
    () => new AttackCard('Lucky Strike', 12, '25% chance to deal double damage', 'crit'),
    () => new AttackCard('Poison Dart', 8, 'Causes bleeding over 2 turns', 'bleed',
      { bleedDamage: 4, bleedTurns: 2 }),
  ],
  2: [
    () => new AttackCard('Knight Slash', 18, 'A trained sword strike'),
    () => new AttackCard('Royal Lance', 24, 'A piercing lance thrust'),
    () => new AttackCard('Blood Saber', 20, 'Damages the enemy and heals you', 'lifesteal'),
    () => new AttackCard('Berserk Charge', 32, 'Huge damage with recoil', 'reckless'),
    () => new AttackCard('Lance Pierce', 20, 'Pierces armor and defenses', 'pierce'),
    () => new AttackCard('Critical Slash', 20, '25% chance to deal double damage', 'crit'),
    () => new AttackCard('Venom Blade', 14, 'Causes bleeding over 2 turns', 'bleed',
      { bleedDamage: 6, bleedTurns: 2 }),
  ],
  3: [
    () => new AttackCard('Plasma Shot', 26, 'A burst of plasma energy'),
    () => new AttackCard('Meteor Strike', 34, 'Calls down a meteor'),
    () => new AttackCard('Soul Drain', 28, 'Drains the enemy life force', 'lifesteal'),
    () => new AttackCard('Doom Blast', 44, 'Devastating blast with recoil', 'reckless'),
    () => new AttackCard('Void Pierce', 30, 'Pierces all defenses', 'pierce'),
    () => new AttackCard('Critical Beam', 28, '25% chance to deal double damage', 'crit'),
    () => new AttackCard('Plague Bomb', 22, 'Causes heavy bleeding over 3 turns', 'bleed',
      { bleedDamage: 9, bleedTurns: 3 }),
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

// Pre-built lookup: card name → factory (covers all worlds).
// Used by DeckBuildScene to hydrate DB-persisted cards back into instances.
const ATTACK_BY_NAME = {};
Object.values(ATTACK_CARDS).forEach((pool) => {
  pool.forEach((factory) => {
    const sample = factory();
    ATTACK_BY_NAME[sample.name] = factory;
  });
});

/**
 * Reconstructs an AttackCard instance from its canonical name.
 * Returns null if the name doesn't match any known card.
 */
export function createAttackCardByName(name) {
  const factory = ATTACK_BY_NAME[name];
  return factory ? factory() : null;
}
