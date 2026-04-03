const express = require("express");
const router = express.Router();

const { login, googleLogin, refreshToken, logout } = require("../controllers/authController");
const { validateRequest, loginRules, googleLoginRules } = require("../middleware/validation");
const { authLimiter } = require("../middleware/security");

// Apply strict rate limiting to all auth routes
router.use(authLimiter);

// POST /login
router.post("/login", loginRules, validateRequest, login);

// POST /google-login
router.post("/google-login", googleLoginRules, validateRequest, googleLogin);

// POST /refresh-token  – uses HttpOnly cookie
router.post("/refresh-token", refreshToken);

// POST /logout
router.post("/logout", logout);


module.exports = router;
