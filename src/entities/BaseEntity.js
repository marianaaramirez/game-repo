export default class BaseEntity {
  constructor(name, hp, attackPower) {
    this.name = name;
    this.maxHp = hp;
    this.hp = hp;
    this.attackPower = attackPower;
  }

  isAlive() {
    return this.hp > 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return !this.isAlive();
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  getHpRatio() {
    return this.hp / this.maxHp;
  }
}
