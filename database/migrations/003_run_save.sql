-- ============================================================
-- Migration 003: RunSave table — snapshot of in-progress runs
-- ============================================================
-- Stores a JSON snapshot of player + map state so the player can
-- pause from CombatScene (between math problems) and resume later
-- from HomeScene. One save row per ongoing Run.
-- ============================================================

USE mathsmash;

CREATE TABLE IF NOT EXISTS RunSave (
  runID       INT      NOT NULL,
  state_json  JSON     NOT NULL,
  saved_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (runID),
  FOREIGN KEY (runID) REFERENCES Run(runID) ON DELETE CASCADE
);
