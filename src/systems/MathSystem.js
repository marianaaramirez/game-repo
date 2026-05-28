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
 * Shared exact-division generator (used by all World 2 tiers).
 * Builds the dividend backwards so the answer is always a whole number.
 */
function generateExactDivision() {
  const divisor = randInt(2, 9);
  let quotient  = randInt(2, 9);
  let dividend  = divisor * quotient;
  while (dividend < 10) {
    quotient = randInt(2, 9);
    dividend = divisor * quotient;
  }
  return { text: `${dividend} / ${divisor}`, answer: quotient, operation: OPERATIONS.DIVISION };
}

/**
 * World 2 — Tier 1: 1-digit × 1-digit multiplication only.
 */
function generateW2Tier1() {
  const a = randInt(1, 9);
  const b = randInt(1, 9);
  return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
}

/**
 * World 2 — Tier 2: 1-digit × 2-digit (10–19) multiplication only.
 */
function generateW2Tier2() {
  const a = randInt(1, 9);
  const b = randInt(10, 19);
  return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
}

/**
 * World 2 — Tier 3: same as Tier 2 multiplication + 50% exact division.
 */
function generateW2Tier3() {
  if (Math.random() < 0.5) {
    const a = randInt(1, 9);
    const b = randInt(10, 19);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision();
}

/**
 * World 2 — Tier 4: 2-digit (11–20) × 1-digit multiplication only.
 */
function generateW2Tier4() {
  const a = randInt(11, 20);
  const b = randInt(1, 9);
  return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
}

/**
 * World 2 — Tier 5 (boss): Tier 4 multiplication + 50% exact division.
 */
function generateW2Tier5() {
  if (Math.random() < 0.5) {
    const a = randInt(11, 20);
    const b = randInt(1, 9);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision();
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
 * World 3 — Tier 1 & 2: 1-digit numbers, 2 signs (+ and ×).
 * Expressions: a + b × c  or  a × b + c
 */
function generateW3Tier1() {
  const a = randInt(1, 9);
  const b = randInt(1, 9);
  const c = randInt(1, 9);
  if (Math.random() < 0.5) {
    return { text: `${a} + ${b} x ${c}`, answer: a + b * c, operation: OPERATIONS.MIXED };
  }
  return { text: `${a} x ${b} + ${c}`, answer: a * b + c, operation: OPERATIONS.MIXED };
}

/**
 * World 3 — Tier 3: 1–2 digit (1–10), 2 signs (any operator).
 * Picks from: a+b×c, a×b+c, a×b-c, a+b-c, a-b+c.
 * Result always kept non-negative.
 */
function generateW3Tier3() {
  const a = randInt(1, 10);
  const b = randInt(1, 10);
  const c = randInt(1, 10);
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
    const sum = a + b;
    const result = sum - c;
    if (result >= 0) return { text: `${a} + ${b} - ${c}`, answer: result, operation: OPERATIONS.MIXED };
    return { text: `${a} + ${b} + ${c}`, answer: sum + c, operation: OPERATIONS.MIXED };
  }
  // type === 4: a - b + c, ensure a >= b
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small} + ${c}`, answer: big - small + c, operation: OPERATIONS.MIXED };
}

/**
 * World 3 — Tier 4 (boss): 2-digit (11–20), 2 signs (any operator).
 * Same expression patterns as Tier 3 but with larger numbers.
 */
function generateW3Tier4() {
  const a = randInt(11, 20);
  const b = randInt(11, 20);
  const c = randInt(11, 20);
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
    const sum = a + b;
    const result = sum - c;
    if (result >= 0) return { text: `${a} + ${b} - ${c}`, answer: result, operation: OPERATIONS.MIXED };
    return { text: `${a} + ${b} + ${c}`, answer: sum + c, operation: OPERATIONS.MIXED };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small} + ${c}`, answer: big - small + c, operation: OPERATIONS.MIXED };
}

/**
 * Picks the correct World 3 generator based on node index.
 * @param {number} nodeIndex
 */
function generateWorld3(nodeIndex = 0) {
  if (nodeIndex === 0)  return generateW3Tier1();
  if (nodeIndex <= 2)   return generateW3Tier1(); // tier 2 = same as tier 1
  if (nodeIndex <= 6)   return generateW3Tier3();
  return generateW3Tier4();                        // node 7 = boss
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
