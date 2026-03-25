const express = require("express");
const router = express.Router();

const { getUsers, createUser } = require("../controllers/userController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { validateRequest, addUserRules } = require("../middleware/validation");

// GET /users – admin only (for user dropdown)
router.get("/", authenticateToken, requireAdmin, (req, res) => {
  return getUsers(req.app.get("db"))(req, res);
});

// POST /users – admin only (create new user)
router.post("/", authenticateToken, requireAdmin, addUserRules, validateRequest, (req, res) => {
  return createUser(req.app.get("db"))(req, res);
});

module.exports = router;

