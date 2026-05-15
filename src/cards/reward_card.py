"""Reward Card implementation for Player Deck."""
from enum import Enum
from dataclasses import dataclass
import random

class RewardType(Enum):
    BONUS_POINTS = "bonus_points"
    EXTRA_TURN = "extra_turn"
    POWER_BOOST = "power_boost"

@dataclass
class RewardCard:
    card_id: str
    name: str
    reward_type: RewardType
    rarity: str
    value: int
    description: str

    def apply(self, player_state: dict) -> dict:
        if self.reward_type == RewardType.BONUS_POINTS:
            player_state["points"] = player_state.get("points", 0) + self.value
        elif self.reward_type == RewardType.EXTRA_TURN:
            player_state["extra_turns"] = player_state.get("extra_turns", 0) + 1
        elif self.reward_type == RewardType.POWER_BOOST:
            player_state["power"] = player_state.get("power", 0) + self.value
        return player_state
