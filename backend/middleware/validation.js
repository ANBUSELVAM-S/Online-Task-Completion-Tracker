const { body, validationResult } = require("express-validator");

// ─── Run Validation & Return Errors ───────────────────────────────────────────
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

// ─── Login Rules ───────────────────────────────────────────────────────────────
const loginRules = [
  body("email")
    .isEmail().withMessage("Invalid email format.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 4 }).withMessage("Password must be at least 4 characters.")
    .trim(),
];

// ─── Add User Rules ────────────────────────────────────────────────────────────
const addUserRules = [
  body("email")
    .isEmail().withMessage("Invalid email format.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain at least one number."),
];

// ─── Add Task Rules ────────────────────────────────────────────────────────────
const addTaskRules = [
  body("assigned_to")
    .isInt({ min: 1 }).withMessage("Assigned user ID must be a valid positive integer."),
  body("date")
    .isISO8601().withMessage("Invalid date format. Use YYYY-MM-DD.")
    .toDate(),
  body("time")
    .matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/)
    .withMessage("Invalid time format. Use HH:MM."),
  body("description")
    .trim()
    .notEmpty().withMessage("Description is required.")
    .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters."),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"]).withMessage("Priority must be 'low', 'medium', or 'high'."),
];

// ─── Google Login Rules ────────────────────────────────────────────────────────
const googleLoginRules = [
  body("email")
    .isEmail().withMessage("Invalid email format.")
    .normalizeEmail(),
  body("google_id")
    .notEmpty().withMessage("Google ID is required.")
    .isString().withMessage("Google ID must be a string."),
];

module.exports = {
  validateRequest,
  loginRules,
  addUserRules,
  addTaskRules,
  googleLoginRules,
};