/**
 * SkillCard.js
 * Special ability cards obtained by defeating bosses or from reward chests.
 * Skill cards do NOT require answering a math problem to activate —
 * they trigger immediately when selected during combat.
 *
 * Only 1 skill card can be active per deck (the most recently acquired one).
 * Skill cards persist through defeats (not lost when the player loses a run).
 *
 * Available skill cards:
 *   SecondChance  — Retry a failed math problem
 *   FreezeTime    — Pause the timer for 4 seconds
 *   ClearMind     — Next card activates without answering
 *   DoublePower   — Double the effect of the next card
 *   VitalityBoost — Restore 10% of max HP immediately
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */
import BaseCard, { CARD_TYPES } from './BaseCard.js';
// --- Individual Skill Card Classes ---

/**
 * Allows the player to retry the current math problem after a wrong answer.
 * Sets 'second_chance' flag in the combat result for CombatScene to handle.
 */
export class SecondChance extends BaseCard {
  constructor() {
    super('Second Chance', CARD_TYPES.SKILL, 0, 'Retry a failed operation');
    this.maxUsesPerLevel = 2;
    this.usesRemaining   = 2;
  }
  apply(player, enemy, effectValue) {
    return { skill: 'second_chance', message: 'Second Chance! You can retry!' };
  }
}
/**
 * Adds 4000ms to the timer effectively by setting a negative timerReduction
 * in the combat context. Gives the player extra time to answer.
 */
export class FreezeTime extends BaseCard {
  constructor() {
    super('Freeze Time', CARD_TYPES.SKILL, 0, 'Pauses time for 4 seconds');
    this.maxUsesPerLevel = 2;
    this.usesRemaining   = 2;
  }
  apply(player, enemy, effectValue) {
    return { skill: 'freeze_time', duration: 4000, message: 'Time frozen for 4 seconds!' };
  }
}
/**
 * Sets 'clearMind' flag in combat context so the next card activates
 * at full power without requiring a math answer.
 */
export class ClearMind extends BaseCard {
  constructor() {
    super('Clear Mind', CARD_TYPES.SKILL, 0, 'Next card does not require activation');
    this.maxUsesPerLevel = 2;
    this.usesRemaining   = 2;
  }
  apply(player, enemy, effectValue) {
    return { skill: 'clear_mind', message: 'Clear Mind! Next card activates automatically!' };
  }
}
/**
 * Sets 'doublePower' flag in combat context so the next card's
 * effectValue is multiplied by 2 before being applied.
 */
export class DoublePower extends BaseCard {
  constructor() {
    super('Double Power', CARD_TYPES.SKILL, 0, 'Doubles the points of next card');
    this.maxUsesPerLevel = 2;
    this.usesRemaining   = 2;
  }
  apply(player, enemy, effectValue) {
    return { skill: 'double_power', message: 'Double Power! Next card effect doubled!' };
  }
}
/**
 * Immediately heals the player for 10% of their maximum HP.
 */
export class VitalityBoost extends BaseCard {
  constructor() {
    super('Vitality Boost', CARD_TYPES.SKILL, 0, 'Gives 10% more life');
    this.maxUsesPerLevel = 2;
    this.usesRemaining   = 2;
  }
  apply(player, enemy, effectValue) {
    const heal = Math.round(player.maxHp * 0.1);
    player.heal(heal);
    return { skill: 'vitality_boost', message: `Vitality Boost! Healed ${heal} HP!` };
  }
}
// Pool of all available skill card classes for random selection
const ALL_SKILLS = [SecondChance, FreezeTime, ClearMind, DoublePower, VitalityBoost];

// Lookup map: DB name → class constructor (matches names in seeds.sql)
const SKILL_BY_NAME = {
  'Second Chance':  SecondChance,
  'Freeze Time':    FreezeTime,
  'Clear Mind':     ClearMind,
  'Double Power':   DoublePower,
  'Vitality Boost': VitalityBoost,
};

/**
 * Returns a new instance of a randomly chosen skill card.
 */
export function getRandomSkillCard() {
  const SkillClass = ALL_SKILLS[Math.floor(Math.random() * ALL_SKILLS.length)];
  return new SkillClass();
}

/**
 * Returns a skill card by index (wraps around if index exceeds array length).
 */
export function getSkillByIndex(index) {
  const SkillClass = ALL_SKILLS[index % ALL_SKILLS.length];
  return new SkillClass();
}

/**
 * Hydrates a SkillCard instance from its catalog name.
 * Used by LoginScene to rebuild player's skill deck from DB rows.
 * Returns null if the name doesn't match any known skill class.
 */
export function getSkillByName(name) {
  const SkillClass = SKILL_BY_NAME[name];
  return SkillClass ? new SkillClass() : null;
}
