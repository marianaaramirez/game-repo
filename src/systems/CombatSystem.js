import MathSystem from './MathSystem.js';
import TimerSystem from './TimerSystem.js';

const COMBAT_STATE = {
  SELECT_CARD: 'select_card',
  MATH_PROBLEM: 'math_problem',
  EVALUATE: 'evaluate',
  ENEMY_TURN: 'enemy_turn',
  WIN: 'win',
  LOSE: 'lose',
};

function evaluatePlayerAction(card, problem, playerAnswer, elapsed) {
  const correct = MathSystem.check(problem, playerAnswer);
  const timedOut = TimerSystem.isExpired(elapsed);

  if (!correct || timedOut) {
    return { success: false, effect: 0, multiplier: 0 };
  }

  const multiplier = TimerSystem.getMultiplier(elapsed);
  const effect = Math.round(card.baseValue * multiplier);

  return { success: true, effect, multiplier };
}

function applyAttack(target, damage) {
  target.hp = Math.max(0, target.hp - damage);
  return target.hp <= 0;
}

function applyDefense(player, defense, incomingDamage) {
  const reduced = Math.max(0, incomingDamage - defense);
  player.hp = Math.max(0, player.hp - reduced);
  return reduced;
}

function enemyTurn(enemy, player, activeDefense = 0) {
  const damage = enemy.attackPower;
  if (activeDefense > 0) {
    return applyDefense(player, activeDefense, damage);
  }
  player.hp = Math.max(0, player.hp - damage);
  return damage;
}

function checkWin(enemy) {
  return enemy.hp <= 0;
}

function checkLose(player) {
  return player.hp <= 0;
}

export default {
  COMBAT_STATE,
  evaluatePlayerAction,
  applyAttack,
  applyDefense,
  enemyTurn,
  checkWin,
  checkLose,
};
