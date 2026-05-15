"""Random Card Reward Generation System."""
import random
from typing import List
from dataclasses import dataclass

@dataclass
class CardReward:
    card_id: str
    name: str
    rarity: str
    value: int

RARITY_WEIGHTS = {"common": 60, "uncommon": 25, "rare": 12, "legendary": 3}

REWARD_POOL = [
    {"name": "Fire Slash", "rarity": "common", "base_value": 10},
    {"name": "Thunder Strike", "rarity": "uncommon", "base_value": 25},
    {"name": "Dragon Breath", "rarity": "rare", "base_value": 50},
    {"name": "Phoenix Rebirth", "rarity": "legendary", "base_value": 100},
]

class CardRewardGenerator:
    def __init__(self, pool=None, weights=None):
        self.pool = pool or REWARD_POOL
        self.weights = weights or RARITY_WEIGHTS

    def generate_one(self, player_level: int = 1) -> CardReward:
        card = self._weighted_random()
        value = int(card["base_value"] * (1 + player_level * 0.15))
        return CardReward(f"card_{random.randint(1000,9999)}", card["name"], card["rarity"], value)

    def generate_batch(self, count: int, player_level: int = 1) -> List[CardReward]:
        return [self.generate_one(player_level) for _ in range(count)]

    def _weighted_random(self):
        weights = [self.weights.get(c["rarity"], 1) for c in self.pool]
        return random.choices(self.pool, weights=weights, k=1)[0]
