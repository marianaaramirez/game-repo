export const CARD_TYPES = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SKILL: 'skill',
};

export default class BaseCard {
  constructor(name, type, baseValue, description) {
    this.name = name;
    this.type = type;
    this.baseValue = baseValue;
    this.description = description;
    this.disabled = false;
    this.locked = false;
  }

  apply(player, enemy, effectValue) {
    // overridden by subclasses
  }

  getColor() {
    switch (this.type) {
      case CARD_TYPES.ATTACK: return 0xff4444;
      case CARD_TYPES.DEFENSE: return 0x4444ff;
      case CARD_TYPES.SKILL: return 0xffaa00;
      default: return 0xcccccc;
    }
  }

  clone() {
    const c = new BaseCard(this.name, this.type, this.baseValue, this.description);
    return c;
  }
}
