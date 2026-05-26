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
 * World 1 — Tier 2: 2-digit operands (10–49), one +/- sign.
 */
function generateW1Tier2() {
  const a = randInt(10, 49);
  const b = randInt(10, 49);
  if (Math.random() < 0.5) {
    return { text: `${a} + ${b}`, answer: a + b, operation: OPERATIONS.ADDITION };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small}`, answer: big - small, operation: OPERATIONS.SUBTRACTION };
}

/**
 * World 1 — Tier 3: 2-digit operands (50–89), one +/- sign.
 */
function generateW1Tier3() {
  const a = randInt(50, 89);
  const b = randInt(50, 89);
  if (Math.random() < 0.5) {
    return { text: `${a} + ${b}`, answer: a + b, operation: OPERATIONS.ADDITION };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { text: `${big} - ${small}`, answer: big - small, operation: OPERATIONS.SUBTRACTION };
}

/**
 * World 1 — Tier 4: 3 operands (10–49), two +/- signs.
 * Boss node difficulty. Result always stays non-negative.
 */
function generateW1Tier4() {
  const a = randInt(10, 49);
  const b = randInt(10, 49);
  const c = randInt(10, 49);
  const ops = ['+', '-'];
  const op1 = ops[Math.floor(Math.random() * 2)];
  const op2 = ops[Math.floor(Math.random() * 2)];
  let answer = a + (op1 === '+' ? b : -b) + (op2 === '+' ? c : -c);
  // If result negative, flip second operator
  if (answer < 0) {
    const flipped = op2 === '+' ? '-' : '+';
    answer = a + (op1 === '+' ? b : -b) + (flipped === '+' ? c : -c);
    return { text: `${a} ${op1} ${b} ${flipped} ${c}`, answer, operation: OPERATIONS.MIXED };
  }
  return { text: `${a} ${op1} ${b} ${op2} ${c}`, answer, operation: OPERATIONS.MIXED };
}

/**
 * Picks the correct World 1 generator based on node index.
 * @param {number} nodeIndex
 */
function generateWorld1(nodeIndex = 0) {
  if (nodeIndex <= 1) return generateW1Tier1();
  if (nodeIndex <= 5) return generateW1Tier2();
  if (nodeIndex <= 6) return generateW1Tier3();
  return generateW1Tier4(); // node 7+ (boss node 8)
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
 * World 2 — Tier 1: 1-digit × 1-digit or division.
 */
function generateW2Tier1() {
  if (Math.random() < 0.5) {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision();
}

/**
 * World 2 — Tier 2: operands 1–10 multiplication or division.
 */
function generateW2Tier2() {
  if (Math.random() < 0.5) {
    const a = randInt(1, 10);
    const b = randInt(1, 10);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision();
}

/**
 * World 2 — Tier 3: 2-digit (11–20) × 1-digit or division.
 */
function generateW2Tier3() {
  if (Math.random() < 0.5) {
    const a = randInt(11, 20);
    const b = randInt(1, 9);
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision();
}

/**
 * World 2 — Tier 4: a × b × c with 1-digit numbers (2 multiplication signs).
 * 50% mult chain, 50% division.
 */
function generateW2Tier4() {
  if (Math.random() < 0.5) {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    const c = randInt(1, 9);
    return { text: `${a} x ${b} x ${c}`, answer: a * b * c, operation: OPERATIONS.MULTIPLICATION };
  }
  return generateExactDivision();
}

/**
 * World 2 — Tier 5 (boss): 2-digit (40–80) operands, two +/- signs.
 * Result always kept non-negative.
 */
function generateW2Tier5() {
  const a   = randInt(40, 80);
  const b   = randInt(40, 80);
  const c   = randInt(40, 80);
  const op1 = Math.random() < 0.5 ? '+' : '-';
  const op2 = Math.random() < 0.5 ? '+' : '-';
  let answer = a + (op1 === '+' ? b : -b) + (op2 === '+' ? c : -c);
  if (answer < 0) {
    // Flip second operator to guarantee positive result
    const flipped = op2 === '+' ? '-' : '+';
    answer = a + (op1 === '+' ? b : -b) + (flipped === '+' ? c : -c);
    return { text: `${a} ${op1} ${b} ${flipped} ${c}`, answer, operation: OPERATIONS.MIXED };
  }
  return { text: `${a} ${op1} ${b} ${op2} ${c}`, answer, operation: OPERATIONS.MIXED };
}

/**
 * Picks the correct World 2 generator based on node index.
 * @param {number} nodeIndex
 */
function generateWorld2(nodeIndex = 0) {
  if (nodeIndex === 0)       return generateW2Tier1();
  if (nodeIndex <= 2)        return generateW2Tier2();
  if (nodeIndex <= 4)        return generateW2Tier3();
  if (nodeIndex === 5)       return generateW2Tier4();
  return generateW2Tier5(); // node 6 = boss
}

/**
 * Level 2 — fallback (kept for compatibility).
 */
function generateLevel2() {
  return generateW2Tier3();
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
function generate(worldLevel = 1, nodeIndex = 0) {
  switch (worldLevel) {
    case 2:  return generateWorld2(nodeIndex);
    case 3:  return generateLevel3();
    case 1:
    default: return generateWorld1(nodeIndex);
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
