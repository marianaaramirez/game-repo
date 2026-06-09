/**
 * BaseCard.js
 * Abstract base class for all cards in the game.
 * Defines common properties (name, type, value, description)
 * and the apply() method that subclasses override to implement their effects.
 *
 * Card types:
 *   ATTACK  - Deals damage to the enemy (red)
 *   DEFENSE - Blocks incoming damage (blue)
 *   SKILL   - Special ability that doesn't require a math problem to activate (orange)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

// Enum of all valid card types
export const CARD_TYPES = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SKILL: 'skill',
};

export default class BaseCard {
  /**
   * {string} name        - Display name of the card
   * {string} type        - One of CARD_TYPES values
   * {number} baseValue   - Base power before timer multiplier is applied
   * {string} description - Short text shown on the card UI
   */
  constructor(name, type, baseValue, description) {
    this.name = name;
    this.type = type;
    this.baseValue = baseValue;
    this.description = description;
    this.disabled = false;
    this.locked = false;
    // Per-combat use limit. 0 = unlimited (ATK/DEF cards cycle instead).
    // Overridden to 2 in SkillCard subclasses.
    this.maxUsesPerLevel = 0;
    this.usesRemaining   = 0;
  }

  /**
   * Resets the card back to its full per-combat use count.
   * Called at the start of every CombatScene.
   */
  resetUses() {
    this.usesRemaining = this.maxUsesPerLevel;
  }

  /**
   * Consumes one use. Returns true if the card still has uses left AFTER consumption.
   * No-op when maxUsesPerLevel is 0 (unlimited — ATK/DEF cards cycle instead).
   */
  consumeUse() {
    if (this.maxUsesPerLevel === 0) return true; // unlimited
    if (this.usesRemaining > 0) this.usesRemaining -= 1;
    return this.usesRemaining > 0;
  }

  /**
   * Returns true if the card is depleted for this combat.
   * Always false when maxUsesPerLevel is 0 (unlimited).
   */
  isDepleted() {
    if (this.maxUsesPerLevel === 0) return false;
    return this.usesRemaining <= 0;
  }
  /** 
   * Applies the card's effect during combat.
   * Overridden by AttackCard, DefenseCard, and each SkillCard subclass.
   * {Player} player       - The player entity
   * {BaseEnemy} enemy     - The current enemy entity
   * {number} effectValue  - Final value after timer multiplier applied
   * returns {{ message: string, ...}}
   */
  apply(player, enemy, effectValue) {
    // Base implementation — no effect, must be overridden
  }
  /**
   * Returns the hex color used to render this card's background.
   * Color is determined by card type: red = attack, blue = defense, orange = skill.
   * {number} Hex color
   */
  getColor() {
    switch (this.type) {
      case CARD_TYPES.ATTACK: return 0xff4444;
      case CARD_TYPES.DEFENSE: return 0x4444ff;
      case CARD_TYPES.SKILL: return 0xffaa00;
      default: return 0xcccccc;
    }
  }
  /**
   * Creates a shallow copy of this card (same properties, new object).
   * {BaseCard}
   */
  clone() {
    const c = new BaseCard(this.name, this.type, this.baseValue, this.description);
    return c;
  }
}
