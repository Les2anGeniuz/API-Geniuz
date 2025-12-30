import jwt from 'jsonwebtoken'

export default function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    console.warn('[requireAdmin] No token found in header:', header);
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const secret = process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET
    const payload = jwt.verify(token, secret)
    console.log('[requireAdmin] JWT payload:', payload);
    if (payload?.role !== 'admin' || !payload?.adminId) {
      console.warn('[requireAdmin] Forbidden: payload invalid', payload);
      return res.status(403).json({ error: 'Forbidden' })
    }
    req.user = payload; // agar bisa diakses di controller
    req.admin = payload; // (opsional, backward compatible)
    next()
  } catch (e) {
    console.warn('[requireAdmin] JWT error:', e?.message || e);
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
