-- ============================================================
-- Migration 004: Admin accounts
-- Adds a separate Admin table so administrators have their own
-- login/register flow, distinct from Player accounts.
-- ============================================================

USE mathsmash;

CREATE TABLE IF NOT EXISTS Admin (
  adminID    INT          NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,            -- bcrypt hash
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (adminID)
);
