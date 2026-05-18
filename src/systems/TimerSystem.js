const TIMER_DURATION = 10000; // 10 seconds total

const ZONES = {
  GREEN: { max: 1.0, min: 0.6, multiplier: 1.0, color: 0x00ff00 },
  YELLOW: { max: 0.6, min: 0.3, multiplier: 0.75, color: 0xffff00 },
  RED: { max: 0.3, min: 0.0, multiplier: 0.5, color: 0xff0000 },
};

function getMultiplier(elapsed) {
  const ratio = Math.max(0, 1 - elapsed / TIMER_DURATION);
  if (ratio >= ZONES.GREEN.min) return ZONES.GREEN.multiplier;
  if (ratio >= ZONES.YELLOW.min) return ZONES.YELLOW.multiplier;
  if (ratio > 0) return ZONES.RED.multiplier;
  return 0;
}

function getZoneColor(elapsed) {
  const ratio = Math.max(0, 1 - elapsed / TIMER_DURATION);
  if (ratio >= ZONES.GREEN.min) return ZONES.GREEN.color;
  if (ratio >= ZONES.YELLOW.min) return ZONES.YELLOW.color;
  return ZONES.RED.color;
}

function getRatio(elapsed) {
  return Math.max(0, 1 - elapsed / TIMER_DURATION);
}

function isExpired(elapsed) {
  return elapsed >= TIMER_DURATION;
}

export default { getMultiplier, getZoneColor, getRatio, isExpired, TIMER_DURATION, ZONES };
