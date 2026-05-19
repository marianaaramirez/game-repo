/**
 * BaseEntity.js
 * Abstract base class for all entities in the game (Player and all enemies).
 * Provides shared HP management, damage, healing, and status checks.
 * All characters extend this class and inherit these core behaviors.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

export default class BaseEntity {
    /**
   * {string} name        - Display name of the entity
   * {number} hp          - Starting (and maximum) hit points
   * {number} attackPower - Base attack damage dealt per turn
   */
  constructor(name, hp, attackPower) {
    this.name = name;
    this.maxHp = hp; // Maximum HP (used for healing cap and HP bar ratio)
    this.hp = hp; // Current HP
    this.attackPower = attackPower;
  }

  /**
   * Returns true if the entity still has HP remaining.
   * {boolean}
   */
  isAlive() {
    return this.hp > 0;
  }

    /**
   * Reduces HP by the given amount, clamped to a minimum of 0.
   * {number} amount - Damage to apply
   * {boolean} True if the entity died from this damage
   */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return !this.isAlive();
  }

  /**
   * Restores HP by the given amount, clamped to maxHp.
   * {number} amount - HP to restore
   */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Returns current HP as a fraction of maxHp (0.0 to 1.0).
   * Used to scale the visual HP bar width in scenes.
   * {number}
   */
  getHpRatio() {
    return this.hp / this.maxHp;
  }
}
