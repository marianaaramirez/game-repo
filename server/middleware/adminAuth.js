/**
 * adminAuth.js (middleware)
 * Verifies the JWT in the Authorization header AND that it belongs to an admin
 * (payload.role === 'admin'). Player tokens are rejected with 403.
 *
 * Expected header: `Authorization: Bearer <token>`
 */

import jwt from 'jsonwebtoken';

export default function adminAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'admin access required' });
    }
    req.admin = payload; // { adminID, username, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// AI tool used for code commenting: Claude (Anthropic)
