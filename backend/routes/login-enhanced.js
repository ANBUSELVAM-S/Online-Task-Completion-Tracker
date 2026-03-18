// ========== UPDATED LOGIN ENDPOINT WITH SECURE COOKIES & GENERIC ERROR MESSAGES ==========

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sanitizeInput } = require("../utils/sanitization");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET;

// Failed login attempts tracking (use Redis in production)
const failedAttempts = {};

/**
 * POST /login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Generic error message for both invalid email and password
    const GENERIC_ERROR = "Invalid email or password";

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);

    // Query user (use parameterized queries to prevent SQL injection)
    db.query(
      "SELECT * FROM users WHERE email = ?",
      [sanitizedEmail],
      async (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "An error occurred. Please try again later."
          });
        }

        // Check if user exists
        if (result.length === 0) {
          // 🔐 Generic error message (don't reveal if email exists)
          return res.status(401).json({
            success: false,
            message: GENERIC_ERROR
          });
        }

        const user = result[0];

        // Check account lockout
        if (failedAttempts[sanitizedEmail] >= 5) {
          return res.status(429).json({
            success: false,
            message: "Account temporarily locked. Try again in 15 minutes."
          });
        }

        // Special case for Google-only users
        if (user.password === "GOOGLE_USER") {
          return res.status(400).json({
            success: false,
            message: "This account is linked to Google. Please login with Google."
          });
        }

        // Verify password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          failedAttempts[sanitizedEmail] = (failedAttempts[sanitizedEmail] || 0) + 1;
          
          // Generic error message
          return res.status(401).json({
            success: false,
            message: GENERIC_ERROR
          });
        }

        // Clear failed attempts on successful login
        delete failedAttempts[sanitizedEmail];

        // Generate tokens
        const accessToken = jwt.sign(
          { id: user.id, role: user.role, email: user.email },
          SECRET_KEY,
          { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
          { id: user.id },
          REFRESH_SECRET_KEY,
          { expiresIn: "7d" }
        );

        // Set secure HTTP-only cookie for refresh token
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Set secure HTTP-only cookie for access token (optional)
        res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({
          success: true,
          message: "Login successful",
          token: accessToken, // Still return in response for flexibility
          user_id: user.id,
          role: user.role,
          email: user.email
        });
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later."
    });
  }
});

module.exports = router;
