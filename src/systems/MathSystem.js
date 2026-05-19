/**
 * MathSystem.js
 * Generates and validates math problems for combat activation.
 * Difficulty scales with world level: world 1 = addition/subtraction,
 * world 2 = multiplication/division, world 3 = all operations mixed.
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

// Enum of supported math operations
const OPERATIONS = {
  ADDITION: 'addition',
  SUBTRACTION: 'subtraction',
  MULTIPLICATION: 'multiplication',
  DIVISION: 'division',
  MIXED: 'mixed',
};

// Maps each world level to the operations that can appear in that world
const DIFFICULTY = {
  1: [OPERATIONS.ADDITION, OPERATIONS.SUBTRACTION],
  2: [OPERATIONS.MULTIPLICATION, OPERATIONS.DIVISION],
  3: [OPERATIONS.ADDITION, OPERATIONS.SUBTRACTION, OPERATIONS.MULTIPLICATION, OPERATIONS.DIVISION],
};

/**
 * Returns a random integer between min and max (inclusive).
 * {number} min
 * {number} max
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a math problem appropriate for the given world level.
 * For division, operands are chosen so the result is always a whole number.
 * {number} worldLevel - 1, 2, or 3
 * returns {{ text: string, answer: number, operation: string }}
 */
function generate(worldLevel = 1) {
  // Pick a random operation allowed for this world level
  const ops = DIFFICULTY[worldLevel] || DIFFICULTY[1];
  const op = ops[randInt(0, ops.length - 1)];

  let a, b, answer, symbol;

  switch (op) {
    case OPERATIONS.ADDITION:
      // Numbers grow larger at higher world levels
      a = randInt(1, 10 + worldLevel * 5);
      b = randInt(1, 10 + worldLevel * 5);
      answer = a + b;
      symbol = '+';
      break;

    case OPERATIONS.SUBTRACTION:
      // b is always <= a to avoid negative answers
      a = randInt(5, 15 + worldLevel * 5);
      b = randInt(1, a);
      answer = a - b;
      symbol = '-';
      break;

    case OPERATIONS.MULTIPLICATION:
      a = randInt(2, 5 + worldLevel * 2);
      b = randInt(2, 5 + worldLevel * 2);
      answer = a * b;
      symbol = 'x';
      break;

    case OPERATIONS.DIVISION:
      // Build division backwards: pick divisor and quotient, compute dividend
      // This guarantees a clean whole-number answer
      b = randInt(2, 5 + worldLevel);
      answer = randInt(2, 10);
      a = b * answer;
      symbol = '/';
      break;

    default:
      // Fallback to simple addition
      a = randInt(1, 10);
      b = randInt(1, 10);
      answer = a + b;
      symbol = '+';
  }

  return {
    text: `${a} ${symbol} ${b}`,  // Display string shown to the player
    answer,                        // Correct numeric answer
    operation: op,                 // Operation type used
  };
}

/**
 * Checks whether the player's answer matches the correct answer.
 * Parses the player input as an integer before comparing.
 * {{ answer: number }} problem
 * {string|number} playerAnswer
 * returns {boolean}
 */
function check(problem, playerAnswer) {
  return parseInt(playerAnswer) === problem.answer;
}

export default { generate, check, OPERATIONS, DIFFICULTY };
