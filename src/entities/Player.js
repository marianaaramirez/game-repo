import BaseEntity from './BaseEntity.js';

export default class Player extends BaseEntity {
  constructor(skinIndex = 0) {
    super('Player', 100, 10);
    this.skinIndex = skinIndex;
    this.level = 1;
    this.deck = [];
    this.skillCards = [];
    this.maxDeckSize = 5;
  }

  addCard(card) {
    this.deck.push(card);
  }

  removeCard(index) {
    this.deck.splice(index, 1);
  }

  addSkillCard(card) {
    this.skillCards.push(card);
  }

  getDeck() {
    return [...this.deck];
  }

  getActiveDeck() {
    const activeSkill = this.skillCards.length > 0 ? [this.skillCards[this.skillCards.length - 1]] : [];
    return [...this.deck.slice(0, this.maxDeckSize - activeSkill.length), ...activeSkill];
  }

  levelUp() {
    this.level += 1;
    this.maxHp += 10;
    this.hp = this.maxHp;
  }

  onDefeat() {
    this.deck = [];
    this.hp = this.maxHp;
    this.level = 1;
  }

  resetForCombat() {
    this.hp = this.maxHp;
  }
}
