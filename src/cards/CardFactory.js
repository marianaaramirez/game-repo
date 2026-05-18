import { getRandomAttackCard } from './AttackCard.js';
import { getRandomDefenseCard } from './DefenseCard.js';
import { getRandomSkillCard } from './SkillCard.js';

function createStarterDeck(worldLevel = 1) {
  return [
    getRandomAttackCard(worldLevel),
    getRandomAttackCard(worldLevel),
    getRandomDefenseCard(worldLevel),
    getRandomDefenseCard(worldLevel),
  ];
}

function createRewardCard(worldLevel = 1) {
  const roll = Math.random();
  if (roll < 0.5) {
    return getRandomAttackCard(worldLevel);
  }
  return getRandomDefenseCard(worldLevel);
}

function createBossReward() {
  return getRandomSkillCard();
}

export default { createStarterDeck, createRewardCard, createBossReward };
