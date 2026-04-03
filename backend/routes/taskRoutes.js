const express = require("express");
const router = express.Router();

const { getTasks, createTask, completeTask, deleteTask } = require("../controllers/taskController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { validateRequest, addTaskRules } = require("../middleware/validation");

// GET /tasks – any authenticated user
router.get("/", authenticateToken, getTasks);

// POST /tasks – admin only
router.post("/", authenticateToken, requireAdmin, addTaskRules, validateRequest, createTask);

// PUT /tasks/:id/complete – any authenticated user (controller enforces ownership)
router.put("/:id/complete", authenticateToken, completeTask);

// DELETE /tasks/:id – admin only
router.delete("/:id", authenticateToken, requireAdmin, deleteTask);


module.exports = router;
