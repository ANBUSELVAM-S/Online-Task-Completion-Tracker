const { sanitizeInput } = require("../utils/sanitization");

// ─── GET /tasks ────────────────────────────────────────────────────────────────
const getTasks = (db) => (req, res) => {
  let sql, params = [];

  if (req.user.role === "admin") {
    sql = `SELECT t.*, u.email AS assigned_user
           FROM tasks t
           JOIN users u ON t.user_id = u.id
           ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, t.date, t.time`;
  } else {
    sql = `SELECT * FROM tasks WHERE user_id = ?
           ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, date, time`;
    params = [req.user.id];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get tasks error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch tasks." });
    }
    return res.json(results);
  });
};

// ─── POST /tasks ───────────────────────────────────────────────────────────────
const createTask = (db, transporter) => (req, res) => {
  const { assigned_to, date, time, description, priority } = req.body;
  const safeDesc = sanitizeInput(description);

  const sql = "INSERT INTO tasks (user_id, date, time, description, priority, status) VALUES (?,?,?,?,?,'pending')";
  db.query(sql, [assigned_to, date, time, safeDesc, priority || "medium"], (err, result) => {
    if (err) {
      console.error("Create task error:", err);
      return res.status(500).json({ success: false, message: "Failed to create task." });
    }

    // Notify assigned user via email
    db.query("SELECT email FROM users WHERE id=?", [assigned_to], (err, userResult) => {
      if (!err && userResult.length > 0) {
        const mailOptions = {
          from: `Task Manager <${process.env.EMAIL_USER}>`,
          to: userResult[0].email,
          subject: "📋 New Task Assigned",
          text: `You have a new task:\n\n${safeDesc}\nDate: ${date}\nTime: ${time}\nPriority: ${priority || "medium"}`,
        };
        transporter.sendMail(mailOptions, (mailErr) => {
          if (mailErr) console.error("Task assignment email error:", mailErr);
        });
      }
    });

    return res.json({ success: true, message: "Task created successfully." });
  });
};

// ─── PUT /tasks/:id/complete ───────────────────────────────────────────────────
const completeTask = (db, transporter) => (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, message: "Invalid task ID." });
  }

  const sql = req.user.role === "admin"
    ? "UPDATE tasks SET status='completed' WHERE id=?"
    : "UPDATE tasks SET status='completed' WHERE id=? AND user_id=?";

  const params = req.user.role === "admin"
    ? [taskId]
    : [taskId, req.user.id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Complete task error:", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized or task not found." });
    }

    // Email admin on task completion
    db.query(
      `SELECT t.description, t.date, t.time, u.email FROM tasks t JOIN users u ON t.user_id = u.id WHERE t.id = ?`,
      [taskId],
      (err, taskResult) => {
        if (!err && taskResult.length > 0) {
          const task = taskResult[0];
          const mailOptions = {
            from: `Task Manager <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: "✅ Task Completed",
            text: `A task has been completed.\n\nTask: ${task.description}\nDate: ${task.date}\nTime: ${task.time}\nCompleted by: ${task.email}`,
          };
          transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) console.error("Completion email error:", mailErr);
          });
        }
      }
    );

    return res.json({ success: true, message: "Task marked as completed." });
  });
};

// ─── DELETE /tasks/:id ─────────────────────────────────────────────────────────
const deleteTask = (db) => (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, message: "Invalid task ID." });
  }

  db.query("DELETE FROM tasks WHERE id=?", [taskId], (err, result) => {
    if (err) {
      console.error("Delete task error:", err);
      return res.status(500).json({ success: false, message: "Failed to delete task." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    return res.json({ success: true, message: "Task deleted successfully." });
  });
};

module.exports = { getTasks, createTask, completeTask, deleteTask };
