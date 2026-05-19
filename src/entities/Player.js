/**
 * Player.js
 * Represents the player character. Extends BaseEntity with deck management,
 * skill card collection, leveling, and roguelike progression rules.
 *
 * Roguelike rules:
 *   - On win:   player levels up (max HP increases, HP fully restored)
 *   - On lose:  normal deck is cleared but all skill cards are kept
 *   - Deck max: 5 cards total (including 1 skill card slot)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import BaseEntity from './BaseEntity.js';

export default class Player extends BaseEntity {
  /**
   * {number} skinIndex - Index of the chosen character skin (0, 1, or 2)
   */
  constructor(skinIndex = 0) {
    super('Player', 100, 10);
    this.skinIndex = skinIndex; // Visual skin selection from CharSelectScene
    this.level = 1; 
    this.deck = []; // Normal cards (attack + defense)
    this.skillCards = []; // Skill cards — kept on defeat
    this.maxDeckSize = 5; // Maximum cards active in combat at once
  }

  /**
   * Adds a normal card to the deck.
   * {BaseCard} card
   */
  addCard(card) {
    this.deck.push(card);
  }
  /**
   * Removes a card from the deck by index.
   * {number} index
   */
  removeCard(index) {
    this.deck.splice(index, 1);
  }

  /**
   * Adds a skill card (obtained by defeating a boss).
   * Skill cards persist through defeats.
   * {BaseCard} card
   */
  addSkillCard(card) {
    this.skillCards.push(card);
  }

  /**
   * Returns a shallow copy of the normal deck.
   * {BaseCard[]}
   */
  getDeck() {
    return [...this.deck];
  }

    /**
   * Returns the combat deck: normal cards + the most recently acquired skill card.
   * Only the last skill card is active per GDD (1 skill card per deck rule).
   * Total size is capped at maxDeckSize.
   * {BaseCard[]}
   */
  getActiveDeck() {
    const activeSkill = this.skillCards.length > 0 ? [this.skillCards[this.skillCards.length - 1]] : [];
    // Fill remaining slots with normal deck cards
    return [...this.deck.slice(0, this.maxDeckSize - activeSkill.length), ...activeSkill];
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
   * Clears the normal deck but retains all skill cards.
   * Resets HP and level for a new run.
   */ 
  onDefeat() {
    this.deck = []; // Normal deck lost
    this.hp = this.maxHp;
    this.level = 1;
    // skillCards intentionally NOT cleared — roguelike persistence
  }

  /**
   * Resets HP to max before starting a new combat encounter.
   */  
  resetForCombat() {
    this.hp = this.maxHp;
  }
}
