/**
 * BaseEnemy.js
 * Abstract base class for all enemies (normal and boss).
 * Each concrete enemy class extends this and overrides useSkill()
 * to implement its unique behavior.
 *
 * Enemy actions each turn:
 *   - 30% chance: use skill (affects timer, cards, or player state)
 *   - 70% chance: standard attack
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEntity from './BaseEntity.js';

export default class BaseEnemy extends BaseEntity {
  /**
   * {string} name       - Enemy display name
   * {number} hp         - Starting HP
   * {number} attackPower - Base damage per attack
   * {string} skillName  - Name of the enemy's special skill
   * {string} skillDesc  - Description shown to the player
   */
  constructor(name, hp, attackPower, skillName, skillDesc) {
    super(name, hp, attackPower);
    this.skillName = skillName;
    this.skillDescription = skillDesc;
    this.isBoss = false;   // Overridden to true in boss subclasses
    //Modifications for each enemy's sprites
    // NEW: visual config
    this.spriteConfig = null;
  }

  getSpriteKey() {
    return this.spriteConfig?.key || this.name.toLowerCase();
  }

  getAnimConfig() {
    return this.spriteConfig?.anims;
  }

  /**
   * Executes the enemy's special skill.
   * Base implementation does nothing — must be overridden by each enemy subclass.
   * {object} player         - The player entity
   * {object} combatContext  - Shared combat state object (modifiable)
   * { message: string } | null
   */
  useSkill(player, combatContext) {
    return null;
  }

  /**
   * Determines what action the enemy takes this turn.
   * Returns 'skill' 30% of the time, 'attack' otherwise.
   * Boss subclasses may override this for more complex behavior patterns.
   * { 'skill' | 'attack' }
   */
  getAction() {
    const useSkillChance = Math.random();
    if (useSkillChance < 0.3) {
      return 'skill';
    }
    return 'attack';
  }
}
