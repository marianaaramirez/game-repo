/**
 * TimerSystem.js
 * Controls the combat timer bar and calculates the effectiveness multiplier
 * based on how quickly the player answers a math problem.
 *
 * Zones:
 *   GREEN  (>60% time left) → 100% card effect
 *   YELLOW (30–60% left)    →  75% card effect
 *   RED    (<30% left)      →  50% card effect
 *   Timeout / wrong answer  →   0% card effect
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

// Total time allowed per problem in milliseconds (10 seconds)
const TIMER_DURATION = 10000;

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
 * Returns the damage multiplier based on elapsed time.
 * {number} elapsed - Milliseconds since the problem was shown
 * returns {number} Multiplier: 1.0, 0.75, 0.5, or 0
 */
function getMultiplier(elapsed) {
  const ratio = Math.max(0, 1 - elapsed / TIMER_DURATION);
  if (ratio >= ZONES.GREEN.min)  return ZONES.GREEN.multiplier;
  if (ratio >= ZONES.YELLOW.min) return ZONES.YELLOW.multiplier;
  if (ratio > 0)                 return ZONES.RED.multiplier;
  return 0; // Timer expired
}

/**
 * Returns the bar color (hex) corresponding to the current timer zone.
 * {number} elapsed - Milliseconds elapsed
 * returns {number} Hex color value
 */
function getZoneColor(elapsed) {
  const ratio = Math.max(0, 1 - elapsed / TIMER_DURATION);
  if (ratio >= ZONES.GREEN.min)  return ZONES.GREEN.color;
  if (ratio >= ZONES.YELLOW.min) return ZONES.YELLOW.color;
  return ZONES.RED.color;
}

/**
 * Returns the remaining time as a ratio from 1.0 (full) to 0.0 (expired).
 * Used to scale the visual width of the timer bar.
 * {number} elapsed
 * returns {number}
 */
function getRatio(elapsed) {
  return Math.max(0, 1 - elapsed / TIMER_DURATION);
}

/**
 * Returns true if the timer has run out (player took too long).
 * {number} elapsed
 * returns {boolean}
 */
function isExpired(elapsed) {
  return elapsed >= TIMER_DURATION;
}

export default { getMultiplier, getZoneColor, getRatio, isExpired, TIMER_DURATION, ZONES };
