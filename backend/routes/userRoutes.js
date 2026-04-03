const express = require("express");
const router = express.Router();

const { getUsers, createUser } = require("../controllers/userController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { validateRequest, addUserRules } = require("../middleware/validation");

// GET /users – admin only (for user dropdown)
router.get("/", authenticateToken, requireAdmin, getUsers);

// POST /users – admin only (create new user)
router.post("/", authenticateToken, requireAdmin, addUserRules, validateRequest, createUser);


module.exports = router;

