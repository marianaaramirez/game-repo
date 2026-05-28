
# Math Smash: Card Adventure

Strategic roguelike deck-building game for children (ages 8–14) that combines mathematics learning with card-based combat.

**Course:** Software Construction and Decision Making — Grupo 501  
**Team:** Daniela Janet Gil Gonzalez, Yuhao Liu, Mariana Ramirez Cervera  
**Institution:** Tecnológico de Monterrey

---

## How to Run

**Requirements:** Node.js installed

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open browser at `http://localhost:5173`

---

## Starting Scene

The prototype starts at **HomeScene** (main menu).

Full flow:
```
HomeScene → CharSelectScene → InstructionsScene → LevelSelectScene → DeckBuildScene → MapScene → CombatScene → RewardScene
```

---

## Controls

| Input | Action |
|---|---|
| Mouse click | Select cards, navigate menus, choose map nodes |
| Keyboard (numbers) | Type math answers during combat |
| Enter | Confirm answer |
| Backspace | Delete last digit |

---

## Completed Functionality

- ✅ Home screen with Play button
- ✅ Character selection (3 skins: Warrior, Mage, Rogue)
- ✅ Instructions screen
- ✅ Level select screen (3 worlds, free selection, cleared levels tracked)
- ✅ Interactive deck builder (max 4 cards, reorganize before each level and after each combat)
- ✅ Procedural map generation (branching nodes: Battle, Chest, Boss)
- ✅ Hand-authored World 1 map (9-node diamond layout)
- ✅ Turn-based combat system
- ✅ Math difficulty per level:
  - Level 1 (Ancient Temple): 2-digit addition and subtraction — 10s timer
  - Level 2 (Castle): 2-digit multiplication and exact division — 13s timer
  - Level 3 (Wasteland): mixed expressions with operator precedence (e.g. 25 + 50 × 6) — 16s timer
- ✅ Timer bar system (Green 100% / Yellow 75% / Red 50% / Timeout 0%), duration scales by level
- ✅ Card system with special effects:
  - Attack: normal, lifesteal (heals player), reckless (self-damage for extra power)
  - Defense: normal, heal (restores HP), counter (reflects damage to enemy)
- ✅ 4 attack cards + 4 defense cards per world (12 attack + 12 defense total)
- ✅ Skill cards (kept on defeat, shown separately from deck)
- ✅ 6 basic enemies with unique skills (Slime, Golem, Spider, Predator Plant, Skeleton, Evil Bat)
- ✅ 2 trap enemies (Card Thief, Swapper)
- ✅ 3 bosses (Vampire King, Bone Mage, Titan)
- ✅ Win/Lose system (keep skill cards on defeat, deck resets)
- ✅ Reward screen (new card after winning, return to level select after boss)

---

## In Development

- 🔧 Sprite/pixel-art assets (currently using colored shapes as placeholders)
- 🔧 Sound effects and background music
- 🔧 Chest interaction animations
- 🔧 Enemy attack animations
- 🔧 Skill card visual effects
- 🔧 Save system (localStorage persistence between sessions)

---

## Project Structure

```
src/
├── main.js              # Entry point
├── scenes/              # All game screens (10 scenes)
├── systems/             # Game logic (Math, Timer, Map, Combat)
├── entities/            # Player, enemies, bosses
│   └── enemies/         # Individual enemy classes
└── cards/               # Card types and factory
```

---

## Build for Production

```bash
npm run build
```

Output in `dist/` folder — ready for static hosting (GitHub Pages, Netlify, Vercel).

## README GENERATED USING AI TOOLS
