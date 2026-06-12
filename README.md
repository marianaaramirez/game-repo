# Math Smash: Card Adventure

Strategic roguelike deck-building game for children (ages 8–14) that combines mathematics learning with card-based combat.

**Course:** Software Construction and Decision Making — Grupo 501
**Team:** Daniela Janet Gil Gonzalez, Yuhao Liu, Mariana Ramirez Cervera
**Institution:** Tecnológico de Monterrey

---

## Project Structure

```
game-repo/
├── src/                              # Frontend (Phaser)
│   ├── main.js                       # Entry point — Phaser config + scene registration
│   ├── api.js                        # Backend API client (player + admin tokens)
│   ├── scenes/                       # All game screens (17 scenes)
│   │   ├── LoginScene.js             # Player login/register + admin login button
│   │   ├── HomeScene.js              # Main menu (Play, Load, Instructions, Stats, Options)
│   │   ├── CharSelectScene.js        # Character skin selection (Warrior/Mage/Rogue)
│   │   ├── InstructionsScene.js      # Game controls and mechanics reference
│   │   ├── LevelSelectScene.js       # World selection (3 worlds)
│   │   ├── DeckBuildScene.js         # Card order builder — cycling queue system
│   │   ├── MapScene.js               # Roguelike node map (Battle/Chest/Boss)
│   │   ├── CombatScene.js            # Turn-based math combat with card cycling
│   │   ├── RewardScene.js            # Post-combat card/heal rewards (no duplicates)
│   │   ├── DefeatScene.js            # Defeat screen with run stats + retry/menu buttons
│   │   ├── StatsScene.js             # Player stats + leaderboard
│   │   ├── OptionsScene.js           # Settings, wipe collection, about
│   │   ├── SavedGamesScene.js        # Pause/resume saved runs
│   │   ├── CreditsScene.js           # Credits screen
│   │   ├── AdminLoginScene.js        # Admin login/register (separate auth flow)
│   │   ├── AdminMenuScene.js         # Admin dashboard (6 report panels)
│   │   └── AdminPlayerStatsScene.js  # Admin view of individual player stats
│   ├── systems/                      # Game logic
│   │   ├── CombatSystem.js           # Turn evaluation, win/lose checks
│   │   ├── MathSystem.js             # Problem generation (3 worlds × 5 tiers per skin)
│   │   ├── MapSystem.js              # Map generation (hand-authored + procedural)
│   │   └── TimerSystem.js            # Timer zones (green/yellow/red)
│   ├── entities/                     # Game entities
│   │   ├── BaseEntity.js             # Shared HP/damage logic
│   │   ├── BaseEnemy.js              # Enemy base class (30% skill / 70% attack)
│   │   ├── Player.js                 # Player state, ordered deck, cycling, leveling
│   │   └── enemies/                  # 11 enemy implementations
│   │       ├── EnemyFactory.js       # Random/boss/trap enemy spawning
│   │       ├── Slime.js              # Reduces card effectiveness 10%
│   │       ├── Spider.js             # Disables 1 random card
│   │       ├── Skeleton.js           # 5 direct damage bypassing defense
│   │       ├── Golem.js              # 50% damage reduction shield
│   │       ├── PredatorPlant.js      # Strikes first if player is slow
│   │       ├── EvilBat.js            # Reduces timer by 2 seconds
│   │       ├── CardThief.js          # Locks 1 card until correct answer
│   │       ├── Swapper.js            # Swaps 1 card temporarily
│   │       ├── VampireKing.js        # Boss W1 — double action
│   │       ├── BoneMage.js           # Boss W2 — damage boost
│   │       └── Titan.js              # Boss W3 — 2-turn charge smash
│   ├── cards/                        # Card system
│   │   ├── BaseCard.js               # Base class (cycling, skill use limits)
│   │   ├── AttackCard.js             # 6 per world × 3 worlds (18 ATK total)
│   │   ├── DefenseCard.js            # 8 per world × 3 worlds (24 DEF total)
│   │   ├── SkillCard.js              # 5 boss-reward skill cards (2 uses/combat)
│   │   └── CardFactory.js            # Starter deck + unique reward card generation
│   ├── assets/                       # Game assets
│   │   ├── Audio/                    # Background music + combat audio (WAV)
│   │   │   ├── All.wav               # HomeScene ambient music
│   │   │   ├── Temple.wav            # World 1 map music
│   │   │   ├── Castle.wav            # World 2 map music
│   │   │   ├── Wasteland.wav         # World 3 map music
│   │   │   ├── Combat.wav            # Normal battle music
│   │   │   └── FinalBoss.wav         # Boss battle music
│   │   ├── Backgrounds/              # World background PNGs
│   │   │   ├── Temple/               # World 1 — 5 combat layers + TempleMap.png
│   │   │   ├── Castle/               # World 2 — 5 combat layers + CastleMap.png
│   │   │   └── Wasteland/            # World 3 — 5 combat layers + WastelandMap.png
│   │   ├── Enemy_sprites/            # Spritesheet PNGs per enemy (Idle/Attack/Hurt/Death)
│   │   │   ├── Slime/ Spider/ Skeleton/ Golem/ PredatorPlant/ EvilBat/
│   │   │   ├── CardThief/ Swapper/
│   │   │   └── VampireKing/ BoneMage/ Titan/
│   │   └── Player_sprites/           # Spritesheet PNGs per skin (Idle/Attack/Hurt/Death)
│   │       ├── Warrior/ Mage/ Rogue/
│   └── ui/
│       └── uiHelpers.js              # Shared UI (badge, loading, confirm, toast, back)
├── server/                           # Backend (Express)
│   ├── index.js                      # Express app entry (mounts all routes)
│   ├── db.js                         # MySQL2 connection pool
│   ├── migrate.js                    # DB setup / migration runner
│   ├── .env                          # Environment variables (NOT committed)
│   ├── .env.example                  # Template for .env
│   ├── middleware/
│   │   ├── auth.js                   # Player JWT verification
│   │   └── adminAuth.js              # Admin JWT verification (role: 'admin' check)
│   └── routes/
│       ├── auth.js                   # /register /login /me
│       ├── admin.js                  # /admin/* — auth, global stats, player list
│       ├── run.js                    # Run CRUD (play session)
│       ├── combat.js                 # /combat /problem
│       ├── catalog.js                # /cards /enemies /maps (public)
│       ├── stats.js                  # /stats /leaderboard + computePlayerStats()
│       ├── skillDeck.js              # Skill card persistence
│       ├── deck.js                   # Attack/defense collection
│       ├── player.js                 # Player profile (skin, cleared levels)
│       └── save.js                   # Pause / resume snapshots
├── database/
│   ├── schemaV3.sql                  # Database schema (current)
│   ├── seeds.sql                     # Static catalog (maps, enemies, cards)
│   ├── seeds_test_players.sql        # Test data — 4 sample players with full stats
│   └── migrations/
│       ├── 001_deckcard_instance_pk.sql
│       ├── 002_deck_unique_player.sql
│       ├── 003_run_save.sql
│       └── 004_admin.sql             # Admin accounts table
├── tests/
│   └── api.test.js                   # Backend integration tests (AI-generated)
├── CARTAS.txt                        # Full card list with mechanics description (ES)
├── INSTRUCCIONES.txt                 # Setup and run guide in Spanish
├── index.html                        # HTML entry (Vite serves this)
├── package.json
├── vite.config.js
└── .gitignore
```

---

## Tech Stack

- **Frontend**: Phaser 3 + Vite (vanilla JavaScript, ES modules)
- **Backend**: Node.js + Express
- **Database**: MySQL 8.0+
- **Auth**: JWT (jsonwebtoken) + bcrypt password hashing (separate flows for players and admins)
- **Tests**: Node built-in test runner (`node:test`)

---

## Prerequisites

Install before continuing:

- **Node.js** ≥ 18 (built-in `fetch` and `node:test` required for backend + tests)
- **MySQL Server** ≥ 8.0 (Community Edition is fine)
- **Git** (to clone the repo)

Verify versions:

```bash
node --version
mysql --version
git --version
```

---

## First-Time Setup

### 1. Clone the repo and install dependencies

```bash
git clone https://github.com/marianaaramirez/game-repo.git
cd game-repo
npm install
```

This installs both frontend (Phaser, Vite) and backend (Express, MySQL2, bcrypt, jsonwebtoken, etc.) dependencies in one go.

### 2. Configure environment variables

```bash
# Windows (CMD/PowerShell):
copy server\.env.example server\.env

# macOS/Linux:
cp server/.env.example server/.env
```

Open `server/.env` and fill in:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mathsmash
JWT_SECRET=
PORT=3000
NODE_ENV=development
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the hex string into `JWT_SECRET=...` in the .env file.

### 3. Make sure MySQL is running

MySQL Server must be active before proceeding.

**Windows — check service:**
```powershell
Get-Service -Name MySQL*
```
If stopped: `Start-Service -Name MySQL80` (or open `services.msc` → MySQL → Start).

**macOS:** `brew services start mysql`

**Linux:** `sudo systemctl start mysql`

### 4. Set up the database

The migrate script creates the database, schema, seed data, and applies all migrations in order:

```bash
npm run migrate
```

Expected output:

```
[migrate] connected to localhost as root
[migrate] running schema...
[migrate] running seeds...
[migrate] running migration 001_deckcard_instance_pk.sql...
[migrate] running migration 002_deck_unique_player.sql...
[migrate] running migration 003_run_save.sql...
[migrate] running migration 004_admin.sql...
[migrate] DONE
```

To start over with a clean database, use `npm run migrate:fresh` (drops the existing `mathsmash` database first).

**If you already set up the DB manually before the migrate script existed**, run this ONCE to bootstrap the migration tracking table without re-executing the SQL files:

```bash
npm run migrate:bootstrap
```

### 5. (Optional) Load test player data

To populate the database with sample players and gameplay data for testing stats and leaderboards:

```bash
mysql -u root -p mathsmash < database/seeds_test_players.sql
```

Or open `database/seeds_test_players.sql` in MySQL Workbench and execute. This creates 4 test players (password: `password123` for all):

| Player | Wins | Style |
|--------|------|-------|
| DragonSlayer99 | 4 | Veteran, 100% accuracy |
| MathWizard | 2 | Slow but accurate |
| NoviceHero | 0 | Beginner, all losses |
| SpeedRunner | 3 | Fast answers, mixed results |

---

## Running the App

The project has **TWO processes** that must run together. Open two terminals.

### Terminal 1 — Backend API

```bash
npm run server:dev
```

Expected output:

```
[server] listening on http://localhost:3000
[db] connected to mathsmash as root
```

Verify: open `http://localhost:3000/api/health` in browser → `{"status":"ok","service":"mathsmash-api"}`

### Terminal 2 — Frontend (Vite dev server)

```bash
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173`. Open it in a browser.

### First-time use in the browser

1. The LoginScene appears. Click **CREATE ACCOUNT**.
2. Enter a username (3+ characters) and password (6+ characters).
3. The game starts. Pick a character and play.

You can also click **SKIP (offline)** to play without backend tracking, or **ADMIN LOGIN** to access the administrator dashboard.

---

## Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (frontend, hot reload) |
| `npm run server:dev` | Backend with nodemon (auto-restart on file change) |
| `npm run server` | Backend without auto-restart |
| `npm run start` | Production backend entrypoint (alias for `server`) |
| `npm run build` | Build frontend bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run migrate` | Run schema + seeds + pending migrations |
| `npm run migrate:fresh` | Drop database, then run everything |
| `npm run migrate:bootstrap` | Mark all migrations as applied without running them |
| `npm run test:api` | Run the API integration test suite |

---

## Game Flow

### Player Flow

```
LoginScene → HomeScene → CharSelectScene → LevelSelectScene
                ↓                                ↓
          SavedGamesScene              DeckBuildScene → MapScene
          InstructionsScene                              ↓
          StatsScene                               CombatScene
          OptionsScene                              ↓         ↓ (lose)
                                               RewardScene  DefeatScene
                                                   ↓            ↓
                                           DeckBuildScene  LevelSelectScene
                                           (loop)          or HomeScene
                                               ↓ (boss win)
                                           LevelSelectScene
```

### Admin Flow

```
LoginScene → "ADMIN LOGIN" → AdminLoginScene → AdminMenuScene
                                                   ↓
                                              6 report panels:
                                              - Combats (wins/losses)
                                              - Answers (correct/incorrect)
                                              - Avg Time
                                              - Enemy Balance
                                              - Chest Balance
                                              - Leaderboard → click player → AdminPlayerStatsScene
```

---

## Game Mechanics

### Characters (Skins)

| Skin | Passive Ability |
|------|----------------|
| **Warrior** (blue) | +3 seconds on every math problem timer |
| **Mage** (purple) | Math difficulty reduced by 3 tiers (battles 1-4 = tier 1, boss = tier 2) |
| **Rogue** (green) | Every 2nd correct answer deals double effect |

### Worlds & Math Difficulty

| World | Name | Math Operations | Tiers |
|-------|------|----------------|-------|
| 1 | Ancient Temple | Addition & subtraction | 1-digit → 3-operand (40-80) |
| 2 | Castle | Multiplication & division | 1-digit × 1-digit → 2-digit × 1-digit |
| 3 | Wasteland | Mixed expressions (operator precedence) | `3 + 5 x 2` → `14 + 17 x 13` |

Math difficulty scales per battle (tier 1–5), not per map node.

### Combat System

Turn-based loop: **SELECT CARD → MATH PROBLEM → EVALUATE → ENEMY TURN → repeat**

- **Timer zones**: Green (>66% time) = 100% effect | Yellow (33-66%) = 75% | Red (<33%) = 50% | Timeout = 0%
- **Card cycling**: ATK/DEF cards cycle — used card moves to a used pile, next card from queue enters hand. No per-combat limit. Skill cards have 2 uses per combat and reset each battle.
- **Skill cards**: Activate immediately without a math problem. Obtained by defeating bosses. Persist through defeats.

### Cards

**Attack cards** (6 per world, 18 total):

| Special | Effect |
|---------|--------|
| `none` | Plain damage |
| `lifesteal` | Deals damage + heals player 50% |
| `reckless` | High damage + 4 recoil to self |
| `crit` | 25% chance for 2× damage |
| `bleed` | Damage + DoT over 2-3 turns |

**Defense cards** (8 per world, 24 total):

| Special | Effect |
|---------|--------|
| `none` (×2) | Plain block |
| `heal` | Block + heal 75% of block value |
| `counter` | Block + reflect 50% back |
| `reflect` | No block — reflects 100% at enemy |
| `regen` | Block + HoT (3-6 HP × 2-3 turns) |
| `evade` | Block + 30% dodge next attack |
| `barrier` | Block + defense persists 1 extra turn |

**Skill cards** (5 total, boss rewards):

| Card | Effect | Uses/Combat |
|------|--------|-------------|
| Second Chance | Retry failed math problem | 2 |
| Freeze Time | +4 seconds on timer | 2 |
| Clear Mind | Next card activates without math | 2 |
| Double Power | Next card effect ×2 | 2 |
| Vitality Boost | Heal 10% max HP | 2 |

### Enemies

**Basic enemies** (6):

| Enemy | HP | ATK | Skill |
|-------|-----|-----|-------|
| Slime | 80 | 6 | Reduces card effectiveness 10% |
| Spider | 75 | 8 | Disables 1 random card |
| Skeleton | 95 | 9 | 5 direct damage ignoring defense |
| Golem | 120 | 9 | 50% damage reduction shield |
| Predator Plant | 90 | 10 | Strikes first if player is slow |
| Evil Bat | 70 | 7 | Reduces timer by 2 seconds |

**Trap enemies** (2, from chest encounters):

| Enemy | HP | ATK | Skill |
|-------|-----|-----|-------|
| Card Thief | 70 | 5 | Locks 1 card until correct answer |
| Swapper | 70 | 5 | Replaces 1 card temporarily |

**Bosses** (1 per world):

| Boss | World | HP | ATK | Skill |
|------|-------|----|-----|-------|
| Vampire King | 1 | 170 | 14 | Double attack in one turn |
| Bone Mage | 2 | 150 | 11 | 2× damage boost next attack |
| Titan | 3 | 220 | 17 | 2-turn charge → 30 direct damage |

### Roguelike Progression

- **Win battle**: Level up (+10 max HP, full heal) + earn a card
- **Win boss**: Earn a permanent skill card + level marked CLEARED
- **Lose battle**: HP and level reset. **Cards are preserved** (wipe only via Options menu)
- **Skill cards** persist through defeats permanently

### Admin Dashboard

Administrators have a separate login and see 6 global analytics panels:

1. **Combats** — Total wins vs losses across all players
2. **Answers** — Total correct vs incorrect answers
3. **Avg Time** — Average math answer speed (all players)
4. **Enemy Balance** — Apparition % of each enemy across all combats
5. **Chest Balance** — Configured drop rates for chest outcomes
6. **Leaderboard** — All players ranked by wins. Click a player to view their full stats (same layout as player's "My Stats")

---

## API Endpoints

All endpoints are mounted under `/api`.

### Player Endpoints (AUTH = player JWT required)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | — | Create player account |
| POST | `/login` | — | Get player JWT |
| GET | `/me` | ✔ | Current player info |
| GET | `/maps` | — | List worlds |
| GET | `/cards` | — | Card catalog (`?world=1&type=attack`) |
| GET | `/enemies` | — | Enemy catalog |
| POST | `/run` | ✔ | Start a play session |
| PUT | `/run/:id` | ✔ | Update run (result, duration) |
| GET | `/run/:id` | ✔ | Get one run |
| POST | `/problem` | ✔ | Log a math problem attempt |
| POST | `/combat` | ✔ | Log a combat encounter |
| GET | `/stats` | ✔ | Aggregated player stats |
| GET | `/leaderboard` | — | Top 10 players |
| GET | `/skill-deck` | ✔ | Owned skill cards |
| POST | `/skill-deck` | ✔ | Unlock a skill card |
| PUT | `/skill-deck/equip` | ✔ | Equip a skill card |
| DELETE | `/skill-deck/equip` | — | Unequip all |
| GET | `/deck` | ✔ | Owned attack/defense cards |
| POST | `/deck/cards` | ✔ | Add card to collection |
| PUT | `/deck/cards/:id/active` | ✔ | Toggle is_active |
| DELETE | `/deck` | ✔ | Wipe collection |
| GET | `/player/me/profile` | ✔ | Skin + cleared levels |
| PUT | `/run/:id/save` | ✔ | Save run snapshot (pause) |
| GET | `/run/:id/save` | ✔ | Load saved snapshot |
| GET | `/saved-runs` | ✔ | List ongoing runs with saves |
| DELETE | `/run/:id/save` | ✔ | Delete a save |

### Admin Endpoints (AUTH = admin JWT required)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/admin/register` | — | Create admin account |
| POST | `/admin/login` | — | Get admin JWT |
| GET | `/admin/me` | ✔ | Current admin info |
| GET | `/admin/stats` | ✔ | Global analytics (combats, answers, avg time, enemy %, chest balance) |
| GET | `/admin/players` | ✔ | Full player leaderboard (all players) |
| GET | `/admin/player/:id/stats` | ✔ | Individual player stats (same format as /stats) |

---

## Production Build

For a static, optimized frontend bundle:

```bash
npm run build
```

Output lives in `dist/`. The bundle is fully static and can be served by any HTTP file server.

Preview the production build before deploying:

```bash
npm run preview
```

The backend still needs to run separately (`npm run start`) to handle API calls.

> **Note**: `BASE_URL` for the API is currently hardcoded to `http://localhost:3000/api` in `src/api.js`. The frontend assumes the backend lives at that address.

---

## Testing

The API has an integration test suite that exercises every endpoint:

```bash
# Start the backend first
npm run server:dev

# In another terminal, run the tests
npm run test:api
```

Tests create a unique throwaway user per run; clean up manually with:

```sql
DELETE FROM Player WHERE username LIKE 'testuser_%';
DELETE FROM Player WHERE username LIKE 'intruder_%';
```

ON DELETE CASCADE removes all related Run, Combat, ProblemStats, and DeckCard rows.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `EADDRINUSE :::3000` | Old backend still running. Kill it: `netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F` |
| `[db] connection failed` | Check `server/.env` credentials + MySQL service is running (`Get-Service MySQL*` on Windows) |
| `ENOENT server/.env` | Copy the template: `copy server\.env.example server\.env` |
| `jwt malformed / invalid signature` | JWT_SECRET in .env is empty or changed. Generate a new one |
| Frontend shows blank page | Backend not running, or `npm run dev` is on a different port — open Vite's reported URL |
| Port 3000 occupied | Change `PORT` in `server/.env` (e.g. `PORT=3001`) |
| Port 5173 occupied | Vite auto-assigns the next available port |
| Migration "duplicate key" error | Run `npm run migrate:fresh` to wipe and restart from scratch |
| Cards/enemies missing in game | Re-run `npm run migrate` to apply the seed file |
| Admin table missing | Run `npm run migrate` to apply migration 004 |

---

## Completed Functionality

- ✅ Login / register / logout with JWT-based session (players and admins)
- ✅ Three character classes with passive abilities (Warrior, Mage, Rogue)
- ✅ Level select screen (3 worlds, free selection, cleared levels persist per account)
- ✅ Interactive deck builder (max 4 cards + 1 skill, deck persists across sessions)
- ✅ Procedural map generation (Battle, Chest, Boss nodes)
- ✅ World 1 hand-authored 9-node diamond layout
- ✅ Turn-based combat with timer-based scoring (Green / Yellow / Red zones)
- ✅ Progressive math difficulty per battle (5 tiers per world, 3 worlds)
- ✅ 18 attack cards with 5 special mechanics (lifesteal, reckless, crit, bleed, none)
- ✅ 24 defense cards with 8 special mechanics (heal, counter, reflect, regen, evade, barrier, none ×2)
- ✅ 5 skill cards as boss rewards (persist through defeats, 2 uses/combat)
- ✅ 6 basic enemies + 2 trap enemies + 3 bosses — each with animated sprites (Idle/Attack/Hurt/Death)
- ✅ Player sprites per character class (Warrior/Mage/Rogue) with combat animations
- ✅ Background images per world (5 combat layers + map background PNG — Temple, Castle, Wasteland)
- ✅ Background music per context (map music per world, battle music, boss music)
- ✅ Card cycling system (used cards queue up and re-enter hand, no per-combat limits for ATK/DEF)
- ✅ Cross-session persistence (skill deck, regular deck, profile, run history)
- ✅ Pause + resume — save mid-combat, continue exactly where you left off
- ✅ Saved Games screen with resume / delete per save
- ✅ Stats screen + global leaderboard (top 10)
- ✅ Admin dashboard with 6 analytics panels (combats, answers, avg time, enemy balance, chest balance, full leaderboard)
- ✅ Admin can view any individual player's stats
- ✅ Options screen (account info, wipe collection, about)
- ✅ Instructions screen accessible from main menu
- ✅ Back buttons + confirm dialogs + online/offline indicator
- ✅ Responsive layout with grid centering + high-DPI text rendering
- ✅ API integration test suite

---

## Notes

- This project is intended to run **locally only**. There is no hosted version.
- The frontend hardcodes the backend at `http://localhost:3000/api` (`src/api.js`).
- `.env` files contain secrets and are git-ignored. Each developer maintains their own.
- Player tokens and admin tokens are stored separately in `localStorage` — switching between player and admin does not conflict.
- README maintained with assistance from AI tools (Claude — Anthropic).
