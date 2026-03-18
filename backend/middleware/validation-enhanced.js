// ========== UPDATED VALIDATION WITH STRONG PASSWORD REQUIREMENTS ==========

const { body, validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: process.env.NODE_ENV === 'development' ? errors.array() : undefined
    });
  }
  next();
};

// ✅ STRONG PASSWORD REQUIREMENTS
const strongPasswordRules = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter (A-Z)")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter (a-z)")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number (0-9)")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character (!@#$%^&*)")
];

// ✅ UPDATED LOGIN RULES
const loginRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
];

// ✅ UPDATED ADD USER RULES WITH STRONG PASSWORD
const addUserRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  ...strongPasswordRules
];

// ✅ UPDATED ADD TASK RULES
const addTaskRules = [
  body("assigned_to")
    .trim()
    .isInt({ min: 1 })
    .withMessage("Assigned user ID must be valid"),
  body("date")
    .trim()
    .isISO8601()
    .withMessage("Invalid date format (YYYY-MM-DD)")
    .custom((value) => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error("Date cannot be in the past");
      }
      return true;
    }),
  body("time")
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("Description must be between 5 and 500 characters"),
  body("priority")
    .optional()
    .trim()
    .isIn(['low', 'medium', 'high'])
    .withMessage("Invalid priority value. Must be 'low', 'medium', or 'high'.")
];

// ✅ UPDATED GOOGLE LOGIN RULES
const googleLoginRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("google_id")
    .trim()
    .notEmpty()
    .withMessage("Google ID is required")
];

module.exports = {
  validateRequest,
  loginRules,
  addUserRules,
  addTaskRules,
  googleLoginRules,
  strongPasswordRules
};
