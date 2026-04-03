const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sanitizeInput } = require("../utils/sanitization");
const User = require("../models/User");

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

// In-memory brute-force tracker (use Redis in production)
const failedAttempts = {};
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 1 * 60 * 1000; // 15 minutes

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}


function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ─── POST /login ───────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const { password } = req.body;
    const email = sanitizeInput(rawEmail);
    const GENERIC_ERROR = "Invalid email or password.";

    // Brute-force lockout check
    const attempt = failedAttempts[email];
    if (attempt && attempt.count >= LOCKOUT_THRESHOLD) {
      const elapsed = Date.now() - attempt.firstFail;
      if (elapsed < LOCKOUT_DURATION_MS) {
        const remaining = Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 60000);
        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. Try again in ${remaining} minute(s).`,
        });
      }
      // Reset after lockout period
      delete failedAttempts[email];
    }

    const user = await User.findOne({ email });

    if (!user) {
      recordFail(email);
      return res.status(401).json({ success: false, message: GENERIC_ERROR });
    }

    if (user.password === "GOOGLE_USER") {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please login with Google.",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      recordFail(email);
      return res.status(401).json({ success: false, message: GENERIC_ERROR });
    }

    // Successful login — clear failed attempts
    delete failedAttempts[email];
    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      token: accessToken,
      user_id: user.id,
      role: user.role,
      email: user.email,
    });
  } catch (err) {
    console.error("Login controller error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── POST /google-login ────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { email, google_id } = req.body;
    const sanitizedEmail = sanitizeInput(email);

    let user = await User.findOne({ email: sanitizedEmail });

    if (user) {
      const { accessToken, refreshToken } = generateTokens(user);
      setRefreshCookie(res, refreshToken);
      return res.json({ success: true, token: accessToken, user_id: user._id, role: user.role });
    }

    // Create new user
    user = new User({
      email: sanitizedEmail,
      google_id,
      password: "GOOGLE_USER",
      role: "user",
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);
    return res.json({
      success: true,
      token: accessToken,
      user_id: user.id,
      role: user.role,
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── POST /refresh-token ───────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token provided." });
    }

    const decoded = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ success: false, message: "User not found." });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    setRefreshCookie(res, newRefreshToken);
    return res.json({ success: true, token: accessToken });
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired refresh token." });
  }
};

// ─── POST /logout ──────────────────────────────────────────────────────────────
const logout = (_req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.json({ success: true, message: "Logged out successfully." });
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function recordFail(email) {
  if (!failedAttempts[email]) {
    failedAttempts[email] = { count: 0, firstFail: Date.now() };
  }
  failedAttempts[email].count += 1;
}

module.exports = { login, googleLogin, refreshToken, logout };
