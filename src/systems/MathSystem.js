const OPERATIONS = {
  ADDITION: 'addition',
  SUBTRACTION: 'subtraction',
  MULTIPLICATION: 'multiplication',
  DIVISION: 'division',
  MIXED: 'mixed',
};

const DIFFICULTY = {
  1: [OPERATIONS.ADDITION, OPERATIONS.SUBTRACTION],
  2: [OPERATIONS.MULTIPLICATION, OPERATIONS.DIVISION],
  3: [OPERATIONS.ADDITION, OPERATIONS.SUBTRACTION, OPERATIONS.MULTIPLICATION, OPERATIONS.DIVISION],
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate(worldLevel = 1) {
  const ops = DIFFICULTY[worldLevel] || DIFFICULTY[1];
  const op = ops[randInt(0, ops.length - 1)];

  let a, b, answer, symbol;

  switch (op) {
    case OPERATIONS.ADDITION:
      a = randInt(1, 10 + worldLevel * 5);
      b = randInt(1, 10 + worldLevel * 5);
      answer = a + b;
      symbol = '+';
      break;

    case OPERATIONS.SUBTRACTION:
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
      b = randInt(2, 5 + worldLevel);
      answer = randInt(2, 10);
      a = b * answer;
      symbol = '/';
      break;

    default:
      a = randInt(1, 10);
      b = randInt(1, 10);
      answer = a + b;
      symbol = '+';
  }

  return {
    text: `${a} ${symbol} ${b}`,
    answer,
    operation: op,
  };
}

function check(problem, playerAnswer) {
  return parseInt(playerAnswer) === problem.answer;
}

export default { generate, check, OPERATIONS, DIFFICULTY };
