const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  console.error("❌ FATAL: JWT_SECRET not defined in .env");
  process.exit(1);
}

// ─── Verify JWT Access Token ───────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token required.",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please refresh your session.",
          expired: true,
        });
      }
      return res.status(403).json({
        success: false,
        message: "Invalid token.",
      });
    }
    req.user = decoded;
    next();
  });
};

// ─── Admin-Only Guard ──────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  next();
};

// ─── Self or Admin Guard ───────────────────────────────────────────────────────
// Allows a user to access their own resource, or admins to access any
const requireSelfOrAdmin = (req, res, next) => {
  const paramId = parseInt(req.params.id, 10);
  if (req.user.role === "admin" || req.user.id === paramId) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. You can only access your own resources.",
  });
};

module.exports = { authenticateToken, requireAdmin, requireSelfOrAdmin };