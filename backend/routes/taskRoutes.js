const express = require("express");
const router = express.Router();

const { getTasks, createTask, completeTask, deleteTask } = require("../controllers/taskController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { validateRequest, addTaskRules } = require("../middleware/validation");

// GET /tasks – any authenticated user
router.get("/", authenticateToken, (req, res) => {
  return getTasks(req.app.get("db"))(req, res);
});

// POST /tasks – admin only
router.post("/", authenticateToken, requireAdmin, addTaskRules, validateRequest, (req, res) => {
  return createTask(req.app.get("db"), req.app.get("transporter"))(req, res);
});

// PUT /tasks/:id/complete – any authenticated user (controller enforces ownership)
router.put("/:id/complete", authenticateToken, (req, res) => {
  return completeTask(req.app.get("db"), req.app.get("transporter"))(req, res);
});

// DELETE /tasks/:id – admin only
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  return deleteTask(req.app.get("db"))(req, res);
});

module.exports = router;
