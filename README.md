# Math Smash: Card Adventure

Strategic roguelike deck-building game for children (ages 8–14) that combines mathematics learning with card-based combat.

**Course:** Software Construction and Decision Making — Grupo 501
**Team:** Daniela Janet Gil Gonzalez, Yuhao Liu, Mariana Ramirez Cervera
**Institution:** Tecnológico de Monterrey

---

## Tech Stack

- **Frontend**: Phaser 3 + Vite (vanilla JavaScript, ES modules)
- **Backend**: Node.js + Express
- **Database**: MySQL 8.0+
- **Auth**: JWT (jsonwebtoken) + bcrypt password hashing
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
# Copy the template into a real .env (NOT committed)
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

### 3. Set up the database

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
[migrate] DONE
```

To start over with a clean database, use `npm run migrate:fresh` (drops the existing `mathsmash` database first).

**If you already set up the DB manually before the migrate script existed**, run this ONCE to bootstrap the migration tracking table without re-executing the SQL files:

```bash
npm run migrate:bootstrap
```

After bootstrap, `npm run migrate` becomes safe to re-run any time.

---

## Running the App

The project has TWO processes that must run together. Open two terminals.

### Terminal 1 — Backend API

```bash
npm run server:dev
```

Expected output:

```
[server] listening on http://localhost:3000
[db] connected to mathsmash as root
```

### Terminal 2 — Frontend (Vite dev server)

```bash
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173`. Open it in a browser.

### First-time use in the browser

1. The LoginScene appears. Click **CREATE ACCOUNT**.
2. Enter a username (3+ characters) and password (6+ characters).
3. The game starts. Pick a character and play.

You can also click **SKIP (offline)** to play without backend tracking.

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
| `npm run migrate:bootstrap` | Mark all migrations as applied without running them (use only if DB was set up manually) |
| `npm run test:api` | Run the API integration test suite (86 tests) |

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

## Project Structure

```
game-repo/
├── src/                       # Frontend (Phaser)
│   ├── main.js                # Entry point — Phaser config + scene registration
│   ├── api.js                 # Backend API client (fetch wrapper)
│   ├── scenes/                # All game screens (13 scenes)
│   ├── systems/               # Combat, Math, Map, Timer logic
│   ├── entities/              # Player + Enemy classes
│   │   └── enemies/           # Individual enemy implementations
│   ├── cards/                 # Attack, Defense, Skill card classes
│   └── ui/
│       └── uiHelpers.js       # Shared UI (badge, loading, confirm, toast)
├── server/                    # Backend (Express)
│   ├── index.js               # Express app entry
│   ├── db.js                  # MySQL2 pool
│   ├── migrate.js             # DB setup / migration runner
│   ├── .env                   # Environment variables (NOT committed)
│   ├── .env.example           # Template for .env
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   └── routes/
│       ├── auth.js            # /register /login /me
│       ├── run.js             # Run CRUD (play session)
│       ├── combat.js          # /combat /problem
│       ├── catalog.js         # /cards /enemies /maps (public)
│       ├── stats.js           # /stats /leaderboard
│       ├── skillDeck.js       # Skill card persistence
│       ├── deck.js            # Attack/defense collection
│       ├── player.js          # Player profile (skin, cleared levels)
│       └── save.js            # Pause / resume snapshots
├── database/
│   ├── schemaV3.sql           # Latest schema definition
│   ├── seeds.sql              # Static catalog (maps, enemies, cards)
│   └── migrations/            # Versioned schema migrations
│       ├── 001_deckcard_instance_pk.sql
│       ├── 002_deck_unique_player.sql
│       └── 003_run_save.sql
├── tests/
│   └── api.test.js            # Backend integration tests
├── package.json
└── vite.config.js
```

---

## Game Flow

```
LoginScene → HomeScene → CharSelectScene → LevelSelectScene
            ↓
            DeckBuildScene → MapScene ⇄ CombatScene → RewardScene → DeckBuildScene (loop)
```

From HomeScene, secondary screens (no progress required):

- **InstructionsScene** — controls + game mechanics reference
- **StatsScene** — personal aggregated stats + global leaderboard
- **OptionsScene** — account info, progress controls (reset, wipe), about
- **SavedGamesScene** — list of paused runs, resume mid-combat

In-combat, the **PAUSE button** (bottom-left, disabled mid-problem) snapshots full state and returns to HomeScene. The saved run can be resumed later from LOAD GAME.

---

## API Endpoints

All endpoints are mounted under `/api`. Endpoints marked **AUTH** require an `Authorization: Bearer <jwt>` header.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Get JWT |
| GET | `/me` | ✔ | Current player |
| GET | `/maps` | — | List worlds |
| GET | `/cards` | — | Card catalog (`?world=1&type=attack`) |
| GET | `/enemies` | — | Enemy catalog |
| POST | `/run` | ✔ | Start a play session |
| PUT | `/run/:id` | ✔ | Update run (result, duration) |
| GET | `/run/:id` | ✔ | Get one run |
| GET | `/runs` | ✔ | List player's runs |
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
| DELETE | `/deck` | ✔ | Wipe collection (roguelike death) |
| GET | `/player/me/profile` | ✔ | Skin + cleared levels |
| PUT | `/run/:id/save` | ✔ | Save run snapshot (pause) |
| GET | `/run/:id/save` | ✔ | Load saved snapshot |
| GET | `/saved-runs` | ✔ | List ongoing runs with saves |
| DELETE | `/run/:id/save` | ✔ | Delete a save |

---

## Testing

The API has a full integration test suite that exercises every endpoint:

```bash
# Start the backend first
npm run server:dev

# In another terminal, run the tests
npm run test:api
```

Expected: **86 pass, 0 fail**. Tests create a unique throwaway user per run; clean up manually with:

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
| `[db] connection failed` | Check `server/.env` credentials + MySQL service is running |
| Frontend shows blank page | Backend not running, or `npm run dev` is on a different port — open Vite's reported URL |
| Tests fail with 401 | Backend reset its JWT_SECRET — make sure server is up before running tests |
| Migration "duplicate key" error | Run `npm run migrate:fresh` to wipe and restart from scratch |
| Cards/enemies missing in game | Re-run `npm run migrate` to apply the seed file |

---

## Completed Functionality

- ✅ Login / register / logout with JWT-based session
- ✅ Three character classes with passive abilities (Warrior, Mage, Rogue)
- ✅ Level select screen (3 worlds, free selection, cleared levels persist per account)
- ✅ Interactive deck builder (max 4 cards, deck persists across browser sessions)
- ✅ Procedural map generation (Battle, Chest, Boss nodes)
- ✅ World 1 hand-authored 9-node diamond layout
- ✅ Turn-based combat with timer-based scoring (Green / Yellow / Red zones)
- ✅ Progressive math difficulty per battle (5 tiers per world)
- ✅ 21 attack cards with 6 special mechanics (lifesteal, reckless, pierce, crit, bleed)
- ✅ 27 defense cards with 8 special mechanics (heal, counter, reflect, regen, taunt, evade, barrier)
- ✅ 5 skill cards as boss rewards (persist through defeats)
- ✅ 6 basic enemies + 2 trap enemies + 3 bosses
- ✅ Cross-session persistence (skill deck, regular deck, profile, run history)
- ✅ Pause + resume — save mid-combat, continue exactly where you left off
- ✅ Saved Games screen with resume / delete per save
- ✅ Stats screen + global leaderboard
- ✅ Options screen (account info, reset progress, wipe collection, about)
- ✅ Instructions screen accessible from main menu
- ✅ Back buttons + confirm dialogs + online/offline indicator
- ✅ Responsive layout with grid centering + high-DPI text rendering
- ✅ Full API integration test suite (86 tests)

---

## In Development

- 🔧 Sprite / pixel-art assets (currently colored shapes as placeholders)
- 🔧 Sound effects and background music
- 🔧 Animations for chest interaction, enemy attacks, skill effects
- 🔧 Production-ready hosting (currently localhost only)

---

## Notes

- This project is intended to run **locally only**. There is no hosted version.
- The frontend hardcodes the backend at `http://localhost:3000/api` (`src/api.js`).
- `.env` files contain secrets and are git-ignored. Each developer maintains their own.
- README maintained with assistance from AI tools (Claude — Anthropic).
