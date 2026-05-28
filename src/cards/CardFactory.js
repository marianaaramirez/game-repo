/**
 * CardFactory.js
 * Centralized factory for creating cards at specific moments in the game.
 * Used by DeckBuildScene (starter deck), RewardScene (post-combat reward),
 * and RewardScene (boss reward → skill card).
 *
 * AI tool used for code commenting: Claude (Anthropic)
 */

import { getRandomAttackCard } from './AttackCard.js';
import { getRandomDefenseCard, DEFENSE_CARDS } from './DefenseCard.js';
import { getRandomSkillCard } from './SkillCard.js';
/**
 * Creates the initial deck for a new run.
 * Always 2 attack cards + 2 defense cards, scaled to the current world level.
 * {number} worldLevel
 * {BaseCard[]} Array of 4 cards
 */
function createStarterDeck(worldLevel = 1) {
  // Always include the heal defense card so players learn that mechanic from turn 1
  const healCard = DEFENSE_CARDS[worldLevel]?.[2]?.() || DEFENSE_CARDS[1][2]();
  return [
    getRandomAttackCard(worldLevel),
    getRandomAttackCard(worldLevel),
    healCard,
    getRandomDefenseCard(worldLevel),
  ];
}
/**
 * Creates a single reward card after winning a normal combat.
 * 50% chance of attack card, 50% chance of defense card.
 * {number} worldLevel
 * {BaseCard}
 */
function createRewardCard(worldLevel = 1) {
  const roll = Math.random();
  if (roll < 0.5) {
    return getRandomAttackCard(worldLevel);
  }
  return getRandomDefenseCard(worldLevel);
}
/**
 * Creates a skill card reward granted when the player defeats a boss.
 * Skill cards persist through defeats (roguelike progression).
 * {BaseCard}
 */
function createBossReward() {
  return getRandomSkillCard();
}

export default { createStarterDeck, createRewardCard, createBossReward };
