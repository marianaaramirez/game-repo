/**
 * auth.js (middleware)
 * Verifies the JWT in the Authorization header and attaches the decoded
 * player payload to req.player. Routes that need authentication mount this.
 *
 * Expected header: `Authorization: Bearer <token>`
 */

import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.player = payload; // { playerID, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
