/**
 * TimerSystem.js
 * Controls the combat timer bar and calculates the effectiveness multiplier
 * based on how quickly the player answers a math problem.
 *
 * Zones:
 *   GREEN  (>60% time left) → 100% card effect
 *   YELLOW (30-60% left)    →  75% card effect
 *   RED    (<30% left)      →  50% card effect
 *   Timeout / wrong answer  →   0% card effect
 *
 * The total time per problem depends on the level, since higher levels have
 * harder math (see getDuration).
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

// Default time allowed per problem in milliseconds (used as a fallback)
const TIMER_DURATION = 10000;

/**
 * Time allowed per problem, per level.
 * Level 2 and 3 get extra time because their math is harder.
 *   Level 1: 10s   Level 2: 13s   Level 3: 16s
 */
const DURATION_BY_LEVEL = {
  1: 13000,
  2: 16000,
  3: 19000,
};

/**
 * Zone definitions.
 * Each zone has a time-ratio range, a damage multiplier, and a display color.
 * Ratios represent the fraction of time remaining (1.0 = full time, 0.0 = expired).
 */
const ZONES = {
  GREEN:  { max: 1.0, min: 0.6, multiplier: 1.0,  color: 0x00ff00 },
  YELLOW: { max: 0.6, min: 0.3, multiplier: 0.75, color: 0xffff00 },
  RED:    { max: 0.3, min: 0.0, multiplier: 0.5,  color: 0xff0000 },
};

/**
 * Returns the total time allowed for a problem at the given level.
 * @param {number} worldLevel - 1, 2, or 3
 * @returns {number} Duration in milliseconds
 */
function getDuration(worldLevel = 1) {
  return DURATION_BY_LEVEL[worldLevel] || TIMER_DURATION;
}

/**
 * Returns the damage multiplier based on elapsed time.
 * @param {number} elapsed  - Milliseconds since the problem was shown
 * @param {number} duration - Total time allowed for this problem
 * @returns {number} Multiplier: 1.0, 0.75, 0.5, or 0
 */
function getMultiplier(elapsed, duration = TIMER_DURATION) {
  const ratio = Math.max(0, 1 - elapsed / duration);
  if (ratio >= ZONES.GREEN.min)  return ZONES.GREEN.multiplier;
  if (ratio >= ZONES.YELLOW.min) return ZONES.YELLOW.multiplier;
  if (ratio > 0)                 return ZONES.RED.multiplier;
  return 0; // Timer expired
}

/**
 * Returns the bar color (hex) corresponding to the current timer zone.
 * @param {number} elapsed  - Milliseconds elapsed
 * @param {number} duration - Total time allowed for this problem
 * @returns {number} Hex color value
 */
function getZoneColor(elapsed, duration = TIMER_DURATION) {
  const ratio = Math.max(0, 1 - elapsed / duration);
  if (ratio >= ZONES.GREEN.min)  return ZONES.GREEN.color;
  if (ratio >= ZONES.YELLOW.min) return ZONES.YELLOW.color;
  return ZONES.RED.color;
}

/**
 * Returns the remaining time as a ratio from 1.0 (full) to 0.0 (expired).
 * Used to scale the visual width of the timer bar.
 * @param {number} elapsed
 * @param {number} duration - Total time allowed for this problem
 * @returns {number}
 */
function getRatio(elapsed, duration = TIMER_DURATION) {
  return Math.max(0, 1 - elapsed / duration);
}

/**
 * Returns true if the timer has run out (player took too long).
 * @param {number} elapsed
 * @param {number} duration - Total time allowed for this problem
 * @returns {boolean}
 */
function isExpired(elapsed, duration = TIMER_DURATION) {
  return elapsed >= duration;
}

export default {
  getDuration,
  getMultiplier,
  getZoneColor,
  getRatio,
  isExpired,
  TIMER_DURATION,
  ZONES,
};
