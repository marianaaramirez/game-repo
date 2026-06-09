/**
 * MathSystem.js
 * Generates and validates math problems for combat activation.
 *
 * Difficulty is fixed per level (the player picks the level on the level-select screen):
 *   Level 1 (Ancient Temple): 2-digit addition and subtraction
 *   Level 2 (Castle):         2-digit multiplication and division
 *   Level 3 (Wasteland):      mixed expressions combining +/- with x and /,
 *                             evaluated with operator precedence (e.g. 25 + 50 x 6)
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

// Enum of supported math operations
const OPERATIONS = {
  ADDITION:       'addition',
  SUBTRACTION:    'subtraction',
  MULTIPLICATION: 'multiplication',
  DIVISION:       'division',
  MIXED:          'mixed',
};

/**
 * Returns a random integer between min and max (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * World 1 — Tier 1: 1-digit operands, one +/- sign.
 * Easiest problems for the first nodes of the map.
 */
function generateW1Tier1() {
  const a = randInt(1, 9);
  const b = randInt(1, 9);
  if (Math.random() < 0.5) {
    return { text: `${a} + ${b}`, answer: a + b, operation: OPERATIONS.ADDITION };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small}`, answer: big - small, operation: OPERATIONS.SUBTRACTION };
}

/**
 * World 1 — Tier 2: 2-digit operands (10–39), one +/- sign.
 */
function generateW1Tier2() {
  const a = randInt(10, 39);
  const b = randInt(10, 39);
  if (Math.random() < 0.5) {
    return { text: `${a} + ${b}`, answer: a + b, operation: OPERATIONS.ADDITION };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small}`, answer: big - small, operation: OPERATIONS.SUBTRACTION };
}

/**
 * World 1 — Tier 3: 2-digit operands (40–80), one +/- sign.
 */
function generateW1Tier3() {
  const a = randInt(40, 80);
  const b = randInt(40, 80);
  if (Math.random() < 0.5) {
    return { text: `${a} + ${b}`, answer: a + b, operation: OPERATIONS.ADDITION };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small}`, answer: big - small, operation: OPERATIONS.SUBTRACTION };
}

/**
 * Shared 3-operand +/- generator with non-negative result guarantee.
 */
function generate3Term(min, max) {
  const a = randInt(min, max);
  const b = randInt(min, max);
  const c = randInt(min, max);
  const ops = ['+', '-'];
  const op1 = ops[Math.floor(Math.random() * 2)];
  const op2 = ops[Math.floor(Math.random() * 2)];
  const answer = a + (op1 === '+' ? b : -b) + (op2 === '+' ? c : -c);
  // Negative result fallback — use all-positive expression to keep answers in range
  if (answer < 0) {
    return { text: `${a} + ${b} + ${c}`, answer: a + b + c, operation: OPERATIONS.MIXED };
  }
  return { text: `${a} ${op1} ${b} ${op2} ${c}`, answer, operation: OPERATIONS.MIXED };
}

/**
 * World 1 — Tier 4: 3 operands (10–39), two +/- signs.
 */
function generateW1Tier4() {
  return generate3Term(10, 39);
}

/**
 * World 1 — Tier 5 (boss): 3 operands (40–80), two +/- signs.
 */
function generateW1Tier5() {
  return generate3Term(40, 80);
}

/**
 * World 1 selector — picks tier from 1 to 5 based on how many battles
 * the player has fought in this map (1-indexed: 1 = first battle).
 * @param {number} battleNumber
 */
function generateW1ByBattle(battleNumber = 1) {
  if (battleNumber <= 1) return generateW1Tier1();
  if (battleNumber <= 2) return generateW1Tier2();
  if (battleNumber <= 3) return generateW1Tier3();
  if (battleNumber <= 4) return generateW1Tier4();
  return generateW1Tier5();
}

/**
 * Legacy node-index based selector (kept for trap chest problems).
 */
function generateWorld1(nodeIndex = 0) {
  if (nodeIndex <= 1) return generateW1Tier1();
  if (nodeIndex <= 5) return generateW1Tier2();
  if (nodeIndex <= 6) return generateW1Tier3();
  return generateW1Tier4();
}

/**
 * Level 1 — fallback (kept for compatibility).
 */
function generateLevel1() {
  return generateW1Tier2();
}

/**
 * Exact-division helper — builds dividend backwards so the answer is always whole.
 * @param {number} minDiv  - minimum divisor
 * @param {number} maxDiv  - maximum divisor
 * @param {number} minQ    - minimum quotient
 * @param {number} maxQ    - maximum quotient
 */
function generateExactDivision(minDiv = 1, maxDiv = 5, minQ = 1, maxQ = 5) {
  const divisor  = randInt(minDiv, maxDiv);
  const quotient = randInt(minQ, maxQ);
  const dividend = divisor * quotient;
  return { text: `${dividend} / ${divisor}`, answer: quotient, operation: OPERATIONS.DIVISION };
}

/**
 * World 2 — Tier 1: multiplication only, 1-digit (1–5), 1 sign.
 * Example: 3 x 4
 */
function generateW2Tier1() {
  const a = randInt(1, 5);
  const b = randInt(1, 5);
  return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
}

/**
 * World 2 — Tier 2: multiplication OR division, 1-digit (1–5), 1 sign.
 * Example: 4 x 3  or  15 / 5
 */
function generateW2Tier2() {
  if (Math.random() < 0.5) {
    const a = randInt(1, 5);
    const b = randInt(1, 5);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision(1, 5, 1, 5);
}

/**
 * World 2 — Tier 3: multiplication only, 1-digit (6–10), 1 sign.
 * Example: 7 x 9
 */
function generateW2Tier3() {
  const a = randInt(6, 10);
  const b = randInt(6, 10);
  return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
}

/**
 * World 2 — Tier 4: multiplication OR division, 2-digit operands (6–10), 1 sign.
 * Example: 8 x 9  or  60 / 6
 */
function generateW2Tier4() {
  if (Math.random() < 0.5) {
    const a = randInt(6, 10);
    const b = randInt(6, 10);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision(6, 10, 6, 10);
}

/**
 * World 2 — Tier 5 (boss): multiplication OR division, 1-digit to 2-digit (11–15), 1 sign.
 * Example: 7 x 13  or  65 / 5
 */
function generateW2Tier5() {
  if (Math.random() < 0.5) {
    const a = randInt(1, 9);
    const b = randInt(11, 15);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  // Division: divisor 1-9, quotient 11-15 → dividend is 2-digit product
  return generateExactDivision(2, 9, 2, 15);
}

/**
 * World 2 selector — picks tier from 1 to 5 based on battles fought.
 * @param {number} battleNumber
 */
function generateW2ByBattle(battleNumber = 1) {
  if (battleNumber <= 1) return generateW2Tier1();
  if (battleNumber <= 2) return generateW2Tier2();
  if (battleNumber <= 3) return generateW2Tier3();
  if (battleNumber <= 4) return generateW2Tier4();
  return generateW2Tier5();
}

/**
 * Legacy node-index based selector (kept for trap chest fallback).
 */
function generateWorld2(nodeIndex = 0) {
  if (nodeIndex === 0)  return generateW2Tier1();
  if (nodeIndex <= 2)   return generateW2Tier2();
  if (nodeIndex <= 4)   return generateW2Tier3();
  if (nodeIndex === 5)  return generateW2Tier4();
  return generateW2Tier5();
}

/**
 * Level 2 — fallback (kept for compatibility).
 */
function generateLevel2() {
  return generateW2Tier3();
}

/**
 * Operand range helpers for World 3 tiers.
 */
function w3OneDigit()  { return randInt(1, 9); }
function w3Two10_19()  { return randInt(10, 19); }
function w3Mixed()     { return Math.random() < 0.5 ? randInt(1, 9) : randInt(10, 19); }

/**
 * Picks one of two patterns: a + b × c  or  a × b + c.
 * Used for tiers that only allow addition and multiplication.
 */
function w3PlusMult(rangeFn) {
  const a = rangeFn();
  const b = rangeFn();
  const c = rangeFn();
  if (Math.random() < 0.5) {
    return { text: `${a} + ${b} x ${c}`, answer: a + b * c, operation: OPERATIONS.MIXED };
  }
  return { text: `${a} x ${b} + ${c}`, answer: a * b + c, operation: OPERATIONS.MIXED };
}

/**
 * Picks one of 5 patterns mixing +, -, ×.
 * Always returns a non-negative result.
 */
function w3AnyOps(rangeFn) {
  const a = rangeFn();
  const b = rangeFn();
  const c = rangeFn();
  const type = Math.floor(Math.random() * 5);

  if (type === 0) {
    return { text: `${a} + ${b} x ${c}`, answer: a + b * c, operation: OPERATIONS.MIXED };
  }
  if (type === 1) {
    return { text: `${a} x ${b} + ${c}`, answer: a * b + c, operation: OPERATIONS.MIXED };
  }
  if (type === 2) {
    const result = a * b - c;
    if (result >= 0) return { text: `${a} x ${b} - ${c}`, answer: result, operation: OPERATIONS.MIXED };
    return { text: `${a} x ${b} + ${c}`, answer: a * b + c, operation: OPERATIONS.MIXED };
  }
  if (type === 3) {
    const result = a + b - c;
    if (result >= 0) return { text: `${a} + ${b} - ${c}`, answer: result, operation: OPERATIONS.MIXED };
    return { text: `${a} + ${b} + ${c}`, answer: a + b + c, operation: OPERATIONS.MIXED };
  }
  // type 4: a - b + c, ensure a >= b for non-negative result
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small} + ${c}`, answer: big - small + c, operation: OPERATIONS.MIXED };
}

/** World 3 — Tier 1: 1-digit, 2 signs (+ and ×). */
function generateW3Tier1() { return w3PlusMult(w3OneDigit); }

/** World 3 — Tier 2: 1-digit, 2 signs (any operator). */
function generateW3Tier2() { return w3AnyOps(w3OneDigit); }

/** World 3 — Tier 3: mixed 1-digit / 2-digit (10-19), 2 signs (+ and ×). */
function generateW3Tier3() { return w3PlusMult(w3Mixed); }

/** World 3 — Tier 4: mixed 1-digit / 2-digit (10-19), 2 signs (any operator). */
function generateW3Tier4() { return w3AnyOps(w3Mixed); }

/** World 3 — Tier 5 (boss): 2-digit (10-19) only, 2 signs (any operator). */
function generateW3Tier5() { return w3AnyOps(w3Two10_19); }

/**
 * World 3 selector — picks tier from 1 to 5 based on battles fought.
 * @param {number} battleNumber
 */
function generateW3ByBattle(battleNumber = 1) {
  if (battleNumber <= 1) return generateW3Tier1();
  if (battleNumber <= 2) return generateW3Tier2();
  if (battleNumber <= 3) return generateW3Tier3();
  if (battleNumber <= 4) return generateW3Tier4();
  return generateW3Tier5();
}

/**
 * Legacy node-index based selector (kept for trap chest fallback).
 */
function generateWorld3(nodeIndex = 0) {
  if (nodeIndex === 0)  return generateW3Tier1();
  if (nodeIndex <= 2)   return generateW3Tier2();
  if (nodeIndex <= 4)   return generateW3Tier3();
  if (nodeIndex <= 6)   return generateW3Tier4();
  return generateW3Tier5();
}

/**
 * Level 3 — mixed expression of the form  A (+/-) B (x or /) C.
 * The x / part is evaluated first (operator precedence), exactly like 25 + 50 x 6.
 * @returns {{ text: string, answer: number, operation: string }}
 */
function generateLevel3() {
  const a = randInt(10, 99);

  if (Math.random() < 0.5) {
    // A + B x C  — multiplication first, so the operator before it is always +
    const b = randInt(10, 99);
    const c = randInt(2, 9);
    return {
      text: `${a} + ${b} x ${c}`,
      answer: a + b * c,
      operation: OPERATIONS.MIXED,
    };
  }

  // A (+/-) B / C  — division first; build B backwards so B / C is whole
  const c = randInt(2, 9);
  let q   = randInt(2, 9);
  let b   = c * q;
  while (b < 10) { // keep B 2-digit
    q = randInt(2, 9);
    b = c * q;
  }
  const sub = q; // value of the B / C part

  if (Math.random() < 0.5) {
    return { text: `${a} + ${b} / ${c}`, answer: a + sub, operation: OPERATIONS.MIXED };
  }
  // a is at least 10 and sub is at most 9, so a - sub is always positive
  return { text: `${a} - ${b} / ${c}`, answer: a - sub, operation: OPERATIONS.MIXED };
}

/**
 * Generates a math problem for the given level and node.
 * World 1 uses nodeIndex to pick a difficulty tier within the map.
 * @param {number} worldLevel - 1, 2, or 3
 * @param {number} nodeIndex  - Current map node (used for World 1 tier selection)
 * @returns {{ text: string, answer: number, operation: string }}
 */
function generate(worldLevel = 1, nodeIndex = 0, tierOffset = 0, battleNumber = null) {
  // Worlds 1 and 2 use battleNumber-based tiers when provided (more accurate than
  // nodeIndex for branching maps where players may skip nodes).
  if (battleNumber !== null) {
    const effectiveBattle = Math.max(1, battleNumber + tierOffset);
    if (worldLevel === 1) return generateW1ByBattle(effectiveBattle);
    if (worldLevel === 2) return generateW2ByBattle(effectiveBattle);
    if (worldLevel === 3) return generateW3ByBattle(effectiveBattle);
  }
  // World 3 (and any fallback) still uses the legacy nodeIndex picker.
  const effectiveIndex = Math.max(0, nodeIndex + tierOffset);
  switch (worldLevel) {
    case 2:  return generateWorld2(effectiveIndex);
    case 3:  return generateWorld3(effectiveIndex);
    case 1:
    default: return generateWorld1(effectiveIndex);
  }
}

/**
 * Checks whether the player's answer matches the correct answer.
 * @param {{ answer: number }} problem
 * @param {string|number} playerAnswer
 * @returns {boolean}
 */
function check(problem, playerAnswer) {
  return parseInt(playerAnswer, 10) === problem.answer;
}

export default { generate, check, OPERATIONS };
