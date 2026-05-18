import BaseCard, { CARD_TYPES } from './BaseCard.js';

export class SecondChance extends BaseCard {
  constructor() {
    super('Second Chance', CARD_TYPES.SKILL, 0, 'Retry a failed operation');
  }
  apply(player, enemy, effectValue) {
    return { skill: 'second_chance', message: 'Second Chance! You can retry!' };
  }
}

export class FreezeTime extends BaseCard {
  constructor() {
    super('Freeze Time', CARD_TYPES.SKILL, 0, 'Pauses time for 4 seconds');
  }
  apply(player, enemy, effectValue) {
    return { skill: 'freeze_time', duration: 4000, message: 'Time frozen for 4 seconds!' };
  }
}

export class ClearMind extends BaseCard {
  constructor() {
    super('Clear Mind', CARD_TYPES.SKILL, 0, 'Next card does not require activation');
  }
  apply(player, enemy, effectValue) {
    return { skill: 'clear_mind', message: 'Clear Mind! Next card activates automatically!' };
  }
}

export class DoublePower extends BaseCard {
  constructor() {
    super('Double Power', CARD_TYPES.SKILL, 0, 'Doubles the points of next card');
  }
  apply(player, enemy, effectValue) {
    return { skill: 'double_power', message: 'Double Power! Next card effect doubled!' };
  }
}

export class VitalityBoost extends BaseCard {
  constructor() {
    super('Vitality Boost', CARD_TYPES.SKILL, 0, 'Gives 10% more life');
  }
  apply(player, enemy, effectValue) {
    const heal = Math.round(player.maxHp * 0.1);
    player.heal(heal);
    return { skill: 'vitality_boost', message: `Vitality Boost! Healed ${heal} HP!` };
  }
}

const ALL_SKILLS = [SecondChance, FreezeTime, ClearMind, DoublePower, VitalityBoost];

export function getRandomSkillCard() {
  const SkillClass = ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)];
  return new SkillClass();
}

export function getSkillByIndex(index) {
  const SkillClass = ALL_SKILLS[index % ALL_SKILLS.length];
  return new SkillClass();
}
