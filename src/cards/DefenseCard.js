/**
 * DefenseCard.js
 * Concrete card class for defense-type cards.
 *
 * Special mechanics (the `special` field):
 *   'none'    — plain block
 *   'heal'    — blocks AND heals the player for 75% of the block value
 *   'counter' — blocks AND reflects 50% of the block value back as damage
 *   'reflect' — does NOT block; reflects 100% of effectValue back at the enemy
 *   'regen'   — blocks AND grants HoT (3 HP per turn × 2 turns)
 *   'taunt'   — blocks AND forces 50% chance that enemy uses skill next turn
 *   'evade'   — blocks AND 30% chance to dodge enemy attack next turn
 *   'barrier' — blocks AND keeps active defense for an extra enemy turn
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseCard, { CARD_TYPES } from './BaseCard.js';

export default class DefenseCard extends BaseCard {
  /**
   * @param {string} name        - Card display name
   * @param {number} baseValue   - Base defense points before timer multiplier
   * @param {string} description
   * @param {string} special     - Special mechanic
   * @param {object} extra       - Special-specific config (e.g. { regenTurns, regenAmount })
   */
  constructor(name, baseValue, description, special = 'none', extra = {}) {
    super(name, CARD_TYPES.DEFENSE, baseValue, description);
    this.special = special;
    this.extra   = extra;
  }

  /**
   * Returns the defense value to store as activeDefense in CombatScene, and
   * applies/queues any special side-effect through the shared combatContext.
   * CombatScene reads ctx flags later in the turn flow.
   *
   * NOTE: To pass ctx, CombatScene calls `card.apply(player, enemy, effectValue, ctx)`.
   * Existing call sites still work — ctx defaults to a no-op object.
   */
  apply(player, enemy, effectValue, ctx = {}) {
    let defense = effectValue;
    let message = `${this.name} blocks ${effectValue} damage!`;

    if (this.special === 'heal') {
      const healed = Math.round(effectValue * 0.75);
      player.heal(healed);
      message += ` Restored ${healed} HP!`;
    } else if (this.special === 'counter') {
      const reflected = Math.round(effectValue * 0.5);
      enemy.takeDamage(reflected);
      message += ` Countered ${reflected} damage!`;
    } else if (this.special === 'reflect') {
      // No block — reflects full damage at the enemy
      defense = 0;
      enemy.takeDamage(effectValue);
      message = `${this.name} reflects ${effectValue} damage back at the enemy!`;
    } else if (this.special === 'regen') {
      const turns  = this.extra.regenTurns  || 2;
      const amount = this.extra.regenAmount || 3;
      ctx.playerRegen       = turns;
      ctx.playerRegenAmount = amount;
      message += ` Regenerating ${amount} HP for ${turns} turns!`;
    } else if (this.special === 'taunt') {
      ctx.tauntForceSkill = true;
      message += ` Enemy may be forced to use a skill!`;
    } else if (this.special === 'evade') {
      ctx.evadeChance = 0.3;
      message += ` 30% chance to dodge next attack!`;
    } else if (this.special === 'barrier') {
      ctx.barrierTurns = 1; // 1 extra enemy turn (total 2)
      message += ` Defense persists for an extra turn!`;
    }

    return { defense, message };
  }
}

/**
 * Available defense card factories organized by world level.
 */
export const DEFENSE_CARDS = {
  1: [
    () => new DefenseCard('Stone Guard', 12, 'Blocks incoming damage'),
    () => new DefenseCard('Sturdy Block', 18, 'Blocks a large amount of damage'),
    () => new DefenseCard('Healing Ward', 14, 'Blocks damage and heals you', 'heal'),
    () => new DefenseCard('Thorn Shield', 13, 'Blocks and reflects damage', 'counter'),
    () => new DefenseCard('Reflect Aura', 10, 'Reflects all damage back (no block)', 'reflect'),
    () => new DefenseCard('Renewal Ward', 12, 'Blocks + regenerates HP over time', 'regen',
      { regenTurns: 2, regenAmount: 3 }),
    () => new DefenseCard('Phantom Cloak', 12, 'Blocks + 30% chance to dodge next attack', 'evade'),
    () => new DefenseCard('Sustain Wall', 10, 'Blocks + defense lasts an extra turn', 'barrier'),
  ],
  2: [
    () => new DefenseCard('Iron Wall', 20, 'Blocks incoming damage'),
    () => new DefenseCard('Castle Aegis', 28, 'Blocks a heavy amount of damage'),
    () => new DefenseCard('Mending Barrier', 20, 'Blocks damage and heals you', 'heal'),
    () => new DefenseCard('Spiked Rampart', 18, 'Blocks and reflects damage', 'counter'),
    () => new DefenseCard('Mirror Plate', 16, 'Reflects all damage back (no block)', 'reflect'),
    () => new DefenseCard('Mending Mantle', 20, 'Blocks + regenerates HP over time', 'regen',
      { regenTurns: 2, regenAmount: 5 }),
    () => new DefenseCard('Shadow Step', 18, 'Blocks + 30% chance to dodge next attack', 'evade'),
    () => new DefenseCard('Iron Bulwark', 16, 'Blocks + defense lasts an extra turn', 'barrier'),
  ],
  3: [
    () => new DefenseCard('Force Field', 28, 'Blocks incoming damage'),
    () => new DefenseCard('Aegis Protocol', 38, 'Blocks a massive amount of damage'),
    () => new DefenseCard('Nano Repair', 28, 'Blocks damage and heals you', 'heal'),
    () => new DefenseCard('Reflect Barrier', 26, 'Blocks and reflects damage', 'counter'),
    () => new DefenseCard('Void Reflector', 24, 'Reflects all damage back (no block)', 'reflect'),
    () => new DefenseCard('Nano Regen Field', 28, 'Blocks + regenerates HP over time', 'regen',
      { regenTurns: 3, regenAmount: 6 }),
    () => new DefenseCard('Ghost Phase', 26, 'Blocks + 30% chance to dodge next attack', 'evade'),
    () => new DefenseCard('Adamant Barrier', 24, 'Blocks + defense lasts an extra turn', 'barrier'),
  ],
};

/**
 * Returns a random defense card for the given world level.
 * @param {number} worldLevel
 * @returns {DefenseCard}
 */
export function getRandomDefenseCard(worldLevel = 1) {
  const cards   = DEFENSE_CARDS[worldLevel] || DEFENSE_CARDS[1];
  const factory = cards[Math.floor(Math.random() * cards.length)];
  return factory();
}

// Pre-built lookup: card name → factory (covers all worlds).
const DEFENSE_BY_NAME = {};
Object.values(DEFENSE_CARDS).forEach((pool) => {
  pool.forEach((factory) => {
    const sample = factory();
    DEFENSE_BY_NAME[sample.name] = factory;
  });
});

/**
 * Reconstructs a DefenseCard instance from its canonical name.
 * Returns null if the name doesn't match any known card.
 */
export function createDefenseCardByName(name) {
  const factory = DEFENSE_BY_NAME[name];
  return factory ? factory() : null;
}
