const express = require("express");
const router = express.Router();

const { getDashboardCounts } = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

// GET /dashboard/counts – any authenticated user (admin sees all, user sees own)
router.get("/counts", authenticateToken, getDashboardCounts);


module.exports = router;
