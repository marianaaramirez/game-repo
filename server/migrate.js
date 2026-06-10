/**
 * migrate.js
 * Database setup script — runs schema, seeds, and migrations in order.
 *
 * Usage:
 *   node server/migrate.js          # run everything (schema + seeds + migrations)
 *   node server/migrate.js --fresh  # DROP database first, then run everything
 *
 * Reads credentials from server/.env. Safe to re-run on existing DB: schema uses
 * IF NOT EXISTS, migrations are idempotent via IF EXISTS / INSERT IGNORE patterns.
 *
 * NOTE: This script is intentionally minimal — it splits SQL files on `;`
 * and executes each statement. It does not support multi-statement procedures.
 */

import mysql from 'mysql2/promise';
import fs    from 'fs/promises';
import path  from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const ROOT          = path.resolve(__dirname, '..');
const DB_DIR        = path.join(ROOT, 'database');
const MIGRATION_DIR = path.join(DB_DIR, 'migrations');

const SCHEMA_FILE = path.join(DB_DIR, 'schemaV3.sql');
const SEEDS_FILE  = path.join(DB_DIR, 'seeds.sql');

const FRESH        = process.argv.includes('--fresh');
const MARK_APPLIED = process.argv.includes('--mark-applied');

// ------------------------------------------------------------
async function run() {
  // Connect WITHOUT a default database — schema script picks it up
  const conn = await mysql.createConnection({
    host:               process.env.DB_HOST,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    multipleStatements: true,
  });
  console.log(`[migrate] connected to ${process.env.DB_HOST} as ${process.env.DB_USER}`);

  try {
    if (FRESH) {
      console.log('[migrate] --fresh: dropping database...');
      await conn.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
    }

    await runFile(conn, SCHEMA_FILE, 'schema');

    // Skip seeds if catalog data is already loaded (idempotent re-run)
    await conn.query(`USE \`${process.env.DB_NAME}\``);
    const [mapCount] = await conn.query('SELECT COUNT(*) AS n FROM Map');
    if (Number(mapCount[0].n) > 0) {
      console.log('[migrate] seeds: catalog already populated, skipping');
    } else {
      await runFile(conn, SEEDS_FILE, 'seeds');
    }

    // Migrations tracking — skip files already applied
    await conn.query(`
      CREATE TABLE IF NOT EXISTS AppliedMigrations (
        filename VARCHAR(255) NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (filename)
      )
    `);

    const files = (await fs.readdir(MIGRATION_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const f of files) {
      const [applied] = await conn.query(
        'SELECT filename FROM AppliedMigrations WHERE filename = ?',
        [f]
      );
      if (applied.length > 0) {
        console.log(`[migrate] migration ${f}: already applied, skipping`);
        continue;
      }
      if (MARK_APPLIED) {
        console.log(`[migrate] migration ${f}: marked as applied (NOT executed)`);
        await conn.query('INSERT INTO AppliedMigrations (filename) VALUES (?)', [f]);
        continue;
      }
      await runFile(conn, path.join(MIGRATION_DIR, f), `migration ${f}`);
      await conn.query('INSERT INTO AppliedMigrations (filename) VALUES (?)', [f]);
    }

    console.log('[migrate] DONE');
  } finally {
    await conn.end();
  }
}

async function runFile(conn, filePath, label) {
  let sql;
  try {
    sql = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`[migrate] ${label}: file not found, skipping`);
      return;
    }
    throw err;
  }

  // Strip line comments, then run as one multi-statement query
  const cleaned = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  if (!cleaned.trim()) {
    console.log(`[migrate] ${label}: empty, skipping`);
    return;
  }

  console.log(`[migrate] running ${label}...`);
  await conn.query(cleaned);
}

run().catch((err) => {
  console.error('[migrate] FAILED:', err.message);
  process.exit(1);
});

// AI tool used for code commenting: Claude (Anthropic)
