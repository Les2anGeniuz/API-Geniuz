import jwt from "jsonwebtoken";

export default function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice(7);

    const secret =
      process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ error: "JWT secret not configured" });
    }

    const payload = jwt.verify(token, secret);

    if (payload?.role !== "admin" || !payload?.adminId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = payload;   // konsisten dengan middleware auth
    req.admin = payload; // backward compatible
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
