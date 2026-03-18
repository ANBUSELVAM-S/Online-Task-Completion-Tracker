// ========== UPDATED AUTH MIDDLEWARE WITH REFRESH TOKEN & LOGOUT ==========

const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET;

if (!SECRET_KEY || !REFRESH_SECRET_KEY) {
  console.error("❌ JWT secrets not defined in .env");
  process.exit(1);
}

// 🔲 Token Blacklist (Use Redis in production)
const tokenBlacklist = new Set();

// 🔐 Verify Access Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Token has been revoked."
    });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please refresh your token.",
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({
        success: false,
        message: "Invalid token."
      });
    }

    req.user = decoded;
    next();
  });
};

// 👑 Admin Only Middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required."
    });
  }
  next();
};

// 🔄 Refresh Token Handler
const handleRefreshToken = (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found."
    });
  }

  jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired refresh token."
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      SECRET_KEY,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      token: newAccessToken
    });
  });
};

// 🚪 Logout Handler
const handleLogout = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    tokenBlacklist.add(token);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({
    success: true,
    message: "Logged out successfully"
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  handleRefreshToken,
  handleLogout,
  tokenBlacklist
};
