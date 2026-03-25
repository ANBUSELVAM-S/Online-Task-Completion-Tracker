const express = require("express");
const router = express.Router();

const { login, googleLogin, refreshToken, logout } = require("../controllers/authController");
const { validateRequest, loginRules, googleLoginRules } = require("../middleware/validation");
const { authLimiter } = require("../middleware/security");

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// POST /login
router.post("/login", loginRules, validateRequest, (req, res) => {
  return login(req.app.get("db"))(req, res);
});

// POST /google-login
router.post("/google-login", googleLoginRules, validateRequest, (req, res) => {
  return googleLogin(req.app.get("db"))(req, res);
});

// POST /refresh-token  – uses HttpOnly cookie
router.post("/refresh-token", (req, res) => {
  return refreshToken(req.app.get("db"))(req, res);
});

// POST /logout
router.post("/logout", (req, res) => {
  return logout(req.app.get("db"))(req, res);
});

module.exports = router;
