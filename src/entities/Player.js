/**
 * Player.js
 * Represents the player character. Extends BaseEntity with collection management,
 * deck ordering, skill card collection, leveling, and roguelike progression rules.
 *
 * Card model:
 *   - collection : every attack/defense card the player owns (source of truth)
 *   - deck       : ALL ATK/DEF cards in player-defined order. First 4 form the
 *                  combat hand; the rest queue up. Cards cycle through the hand
 *                  during combat (used card exits, next queued card enters).
 *   - skillCards : boss-reward skill cards, kept in a SEPARATE slot
 *                  (they do NOT participate in cycling, limited to 2 uses/combat)
 *
 * Roguelike rules:
 *   - On win:   player levels up (max HP increases, HP fully restored)
 *   - On lose:  HP and level reset; collection and deck PRESERVED
 *   - Wipe only happens via OptionsScene "Wipe Local Collection"
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEntity from './BaseEntity.js';

export default class Player extends BaseEntity {
  /**
   * @param {number} skinIndex - Index of the chosen character skin (0, 1, or 2)
   */
  constructor(skinIndex = 0) {
    super('Player', 100, 10);
    this.skinIndex     = skinIndex;
    this.level         = 1;
    this.collection    = [];
    this.deck          = [];  // ordered list of ALL ATK/DEF cards
    this.skillCards    = [];
    this.selectedSkill = null;

    // --- Skin-based passive powers ---
    this.timerBonus           = 0;
    this.mathDifficultyOffset = 0;
    this.rogueDouble          = false;

    if (skinIndex === 0) {
      this.timerBonus = 3000;           // Warrior: +3s timer
    } else if (skinIndex === 1) {
      this.mathDifficultyOffset = -2;   // Mage: easier math
    } else if (skinIndex === 2) {
      this.rogueDouble = true;          // Rogue: 2nd-answer double
    }
  }

  /**
   * Adds a card to the collection AND appends it to the ordered deck.
   * New cards always go to the end (queue position).
   * @param {BaseCard} card
   */
  addCard(card) {
    this.collection.push(card);
    this.deck.push(card);
  }

  /**
   * Removes a card from both the collection and the deck.
   * @param {BaseCard} card
   */
  removeCard(card) {
    const ci = this.collection.indexOf(card);
    if (ci >= 0) this.collection.splice(ci, 1);
    const di = this.deck.indexOf(card);
    if (di >= 0) this.deck.splice(di, 1);
  }

  /**
   * Swaps two cards in the ordered deck by index.
   * Used by DeckBuildScene to let the player reorder cards.
   */
  swapCardOrder(indexA, indexB) {
    if (indexA < 0 || indexA >= this.deck.length) return;
    if (indexB < 0 || indexB >= this.deck.length) return;
    const temp = this.deck[indexA];
    this.deck[indexA] = this.deck[indexB];
    this.deck[indexB] = temp;
  }

  /**
   * Adds a skill card (obtained by defeating a boss).
   * Skill cards persist through defeats and use a separate slot.
   * Duplicates (by name) are silently ignored.
   * @param {BaseCard} card
   * @returns {boolean} true if added, false if duplicate
   */
  addSkillCard(card) {
    if (this.skillCards.some((c) => c.name === card.name)) {
      return false;
    }
    this.skillCards.push(card);
    if (!this.selectedSkill) {
      this.selectedSkill = card;
    }
    return true;
  }

  /**
   * Toggles the selected skill card for the next combat (max 1 slot).
   * @param {BaseCard} card
   * @returns {string} 'equipped' | 'unequipped'
   */
  toggleSkillCard(card) {
    if (this.selectedSkill === card) {
      this.selectedSkill = null;
      return 'unequipped';
    }
    this.selectedSkill = card;
    return 'equipped';
  }

  /**
   * Returns a shallow copy of the ordered deck.
   * @returns {BaseCard[]}
   */
  getDeck() {
    return [...this.deck];
  }

  /**
   * Returns the initial combat hand (first 4 ATK/DEF) plus the equipped
   * skill card. CombatScene uses this for the first draw, then manages
   * cycling internally.
   * @returns {BaseCard[]}
   */
  getActiveDeck() {
    const hand = this.deck.slice(0, 4);
    const activeSkill = this.selectedSkill ? [this.selectedSkill] : [];
    return [...hand, ...activeSkill];
  }

  /**
   * Called when the player wins a combat.
   * Increases level, raises max HP by 10, and fully restores HP.
   */
  levelUp() {
    this.level += 1;
    this.maxHp += 10;
    this.hp = this.maxHp;
  }

  /**
   * Called when the player loses a combat OR abandons a run.
   * Resets HP and level. Collection and deck PRESERVED.
   */
  onDefeat() {
    this.hp    = this.maxHp;
    this.level = 1;
  }

  /**
   * Hard wipe — clears collection and deck entirely.
   * Used only by the manual wipe button in OptionsScene.
   * Skill cards preserved.
   */
  wipeCollection() {
    this.collection = [];
    this.deck       = [];
    this.hp         = this.maxHp;
    this.level      = 1;
  }

  /**
   * Resets HP to max before starting a new combat encounter.
   */
  resetForCombat() {
    this.hp = this.maxHp;
  }

  /**
   * Resets per-combat use counters. Only skill cards have use limits;
   * ATK/DEF cards cycle instead of being consumed.
   */
  resetCardUses() {
    this.skillCards.forEach((c) => c.resetUses && c.resetUses());
  }
}
