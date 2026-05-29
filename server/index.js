/**
 * index.js
 * Express server entry point for the Math Smash backend API.
 *
 * All routes are mounted under /api.
 * CORS is enabled so the Phaser frontend (Vite dev server on :5173)
 * can call this server (:3000) without origin issues.
 */

import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import path    from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';

// Load .env relative to this file (so `node server/index.js` works from any cwd)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app  = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());                 // Allow Phaser frontend on a different port
app.use(express.json());         // Parse JSON request bodies

// --- Healthcheck ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'mathsmash-api' });
});

// --- Routes ---
app.use('/api', authRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: `route not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
