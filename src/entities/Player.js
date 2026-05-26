/**
 * Player.js
 * Represents the player character. Extends BaseEntity with collection management,
 * deck building, skill card collection, leveling, and roguelike progression rules.
 *
 * Card model:
 *   - collection : every attack/defense card the player owns
 *   - deck       : the cards selected for combat, capped at maxDeckSize (4)
 *   - skillCards : boss-reward skill cards, kept in a SEPARATE slot
 *                  (they do NOT count toward the 4-card deck limit)
 *
 * Roguelike rules:
 *   - On win:   player levels up (max HP increases, HP fully restored)
 *   - On lose:  collection and deck are wiped, but all skill cards are kept
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
    this.skinIndex     = skinIndex; // Visual skin selection from CharSelectScene
    this.level         = 1;
    this.collection    = []; // Every attack/defense card owned by the player
    this.deck          = []; // Cards selected for combat (max maxDeckSize)
    this.skillCards    = []; // Skill cards — separate slot, kept on defeat
    this.selectedSkill = null; // The one skill card equipped for next combat (null = none)
    this.maxDeckSize   = 4;  // Maximum attack/defense cards active in combat
  }

  /**
   * Adds a card to the collection.
   * If the deck still has free slots, the card is auto-selected into it
   * so newly earned cards are usable right away.
   * @param {BaseCard} card
   */
  addCard(card) {
    this.collection.push(card);
    if (this.deck.length < this.maxDeckSize) {
      this.deck.push(card);
    }
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
   * Adds a skill card (obtained by defeating a boss).
   * Skill cards persist through defeats and use a separate slot.
   * @param {BaseCard} card
   */
  addSkillCard(card) {
    this.skillCards.push(card);
    // Auto-equip the first skill card obtained so it's usable right away
    if (!this.selectedSkill) {
      this.selectedSkill = card;
    }
  }

  /**
   * Toggles the selected skill card for the next combat (max 1 slot).
   * Clicking the already-equipped skill deselects it.
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
   * Toggles a card's presence in the active deck (used by the deck builder UI).
   * @param {BaseCard} card
   * @returns {string} 'added' | 'removed' | 'full' (deck already at max size)
   */
  toggleDeckCard(card) {
    const i = this.deck.indexOf(card);
    if (i >= 0) {
      this.deck.splice(i, 1);
      return 'removed';
    }
    if (this.deck.length >= this.maxDeckSize) {
      return 'full';
    }
    this.deck.push(card);
    return 'added';
  }

  /**
   * Returns true if the given card is currently selected in the deck.
   * @param {BaseCard} card
   * @returns {boolean}
   */
  isInDeck(card) {
    return this.deck.includes(card);
  }

  /**
   * Returns a shallow copy of the selected deck.
   * @returns {BaseCard[]}
   */
  getDeck() {
    return [...this.deck];
  }

  /**
   * Returns the combat deck: the selected cards (max 4) plus the most recently
   * acquired skill card. The skill card occupies a separate slot and does not
   * count toward the 4-card limit.
   * @returns {BaseCard[]}
   */
  getActiveDeck() {
    const activeSkill = this.selectedSkill ? [this.selectedSkill] : [];
    return [...this.deck, ...activeSkill];
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
   * Called when the player loses a combat (roguelike death handling).
   * Wipes the collection and deck but retains all skill cards.
   * Resets HP and level for a new run.
   */
  onDefeat() {
    this.collection = []; // Owned cards lost
    this.deck       = []; // Deck lost
    this.hp         = this.maxHp;
    this.level      = 1;
    // skillCards intentionally NOT cleared — roguelike persistence
  }

  /**
   * Resets HP to max before starting a new combat encounter.
   */
  resetForCombat() {
    this.hp = this.maxHp;
  }
}
