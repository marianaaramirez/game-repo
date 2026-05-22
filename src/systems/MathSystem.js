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
 * Level 1 — 2-digit addition or subtraction.
 * Subtraction keeps both operands 2-digit and the result non-negative.
 * @returns {{ text: string, answer: number, operation: string }}
 */
function generateLevel1() {
  if (Math.random() < 0.5) {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    return { text: `${a} + ${b}`, answer: a + b, operation: OPERATIONS.ADDITION };
  }
  // Subtraction: a is the larger operand so the answer stays positive
  const a = randInt(20, 99);
  const b = randInt(10, a);
  return { text: `${a} - ${b}`, answer: a - b, operation: OPERATIONS.SUBTRACTION };
}

/**
 * Level 2 — 2-digit multiplication or division.
 * Multiplication: a 2-digit number times a 1-digit number.
 * Division: built backwards so the dividend is 2-digit and the answer is whole.
 * @returns {{ text: string, answer: number, operation: string }}
 */
function generateLevel2() {
  if (Math.random() < 0.5) {
    const a = randInt(10, 99); // 2-digit operand
    const b = randInt(2, 9);   // 1-digit operand
    return { text: `${a} x ${b}`, answer: a * b, operation: OPERATIONS.MULTIPLICATION };
  }
  // Division: pick divisor and quotient, then derive the dividend
  const divisor = randInt(2, 9);
  let quotient  = randInt(2, 9);
  let dividend  = divisor * quotient;
  // Make sure the dividend has 2 digits
  while (dividend < 10) {
    quotient = randInt(2, 9);
    dividend = divisor * quotient;
  }
  return { text: `${dividend} / ${divisor}`, answer: quotient, operation: OPERATIONS.DIVISION };
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
 * Generates a math problem for the given level.
 * @param {number} worldLevel - 1, 2, or 3
 * @returns {{ text: string, answer: number, operation: string }}
 */
function generate(worldLevel = 1) {
  switch (worldLevel) {
    case 2:  return generateLevel2();
    case 3:  return generateLevel3();
    case 1:
    default: return generateLevel1();
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
