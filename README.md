
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
HomeScene → CharSelectScene → InstructionsScene → DeckBuildScene → MapScene → CombatScene → RewardScene
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

- ✅ Home screen with Play, Options, Credits
- ✅ Character selection (3 skins: Warrior, Mage, Rogue)
- ✅ Instructions screen
- ✅ Deck building screen (starter deck with Attack + Defense cards)
- ✅ Procedural map generation (branching nodes: Battle, Chest, Boss)
- ✅ Turn-based combat system
- ✅ Math problem generation (addition, subtraction, multiplication, division)
- ✅ Timer bar system (Green 100% / Yellow 75% / Red 50% / Timeout 0%)
- ✅ Card system (Attack, Defense, Skill cards)
- ✅ 6 basic enemies with unique skills (Slime, Golem, Spider, Predator Plant, Skeleton, Evil Bat)
- ✅ 2 trap enemies (Card Thief, Swapper)
- ✅ 3 bosses (Vampire King, Bone Mage, Titan)
- ✅ Win/Lose system (keep skill cards on defeat)
- ✅ Reward screen (new card or HP after winning)
- ✅ 3 worlds with increasing math difficulty (Ancient Temple, Castle, Wasteland)
- ✅ Options menu (volume, math difficulty preference)
- ✅ Credits screen

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
├── scenes/              # All game screens (9 scenes)
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