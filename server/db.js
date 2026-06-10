/**
 * db.js
 * MySQL connection pool using mysql2/promise.
 * The pool is reused across all routes — do not create new connections per request.
 *
 * Usage:
 *   import db from './db.js';
 *   const [rows] = await db.query('SELECT * FROM Player WHERE playerID = ?', [id]);
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the server folder regardless of where the process is started
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host:            process.env.DB_HOST,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  database:        process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:          0,
});

// Quick startup ping so failures are visible immediately, not on first request
pool.getConnection()
  .then((conn) => {
    console.log(`[db] connected to ${process.env.DB_NAME} as ${process.env.DB_USER}`);
    conn.release();
  })
  .catch((err) => {
    console.error('[db] connection failed:', err.message);
  });

export default pool;

// AI tool used for code commenting: Claude (Anthropic)
