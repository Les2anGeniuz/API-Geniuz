// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id_User, email }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default requireAuth;
