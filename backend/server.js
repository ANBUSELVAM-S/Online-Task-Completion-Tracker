const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Import Middleware
const applySecurity = require("./middleware/security.js");
const { authenticateToken, requireAdmin } = require("./middleware/auth.js");
const {
  validateRequest,
  loginRules,
  addUserRules,
  addTaskRules,
  googleLoginRules,
} = require("./middleware/validation");

const app = express();
applySecurity(app);
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  console.error("❌ FATAL ERROR: JWT_SECRET is not defined in .env");
  process.exit(1);
}

const nodemailer = require("nodemailer");
const cron = require("node-cron"); // ✅ added

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// ✅ SCALABILITY: Use Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* ================= LOGIN ================= */
app.post(
  "/login",
  loginRules,
  validateRequest,
  (req, res) => {
  const { email, password } = req.body;
  console.log("loginRules:", loginRules);
  console.log("validateRequest:", validateRequest);

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ success: false });

      if (result.length === 0) {
        return res.json({ success: false, message: "Invalid email" });
      }

      const user = result[0];

      // ✅ FIX: Prevent crash if user is Google-only
      if (user.password === "GOOGLE_USER") {
        return res.json({ success: false, message: "Please login with Google" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.json({ success: false, message: "Wrong password" });
      }

      // ✅ SECURITY: Generate JWT
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });

      res.json({
        success: true,
        token,
        user_id: user.id,
        role: user.role
      });
    }
  );
});
/* ================= GET USERS (For Admin Dropdown) ================= */
app.get("/users", authenticateToken, requireAdmin, (req, res) => {
  db.query("SELECT id, email FROM users WHERE role = 'user'", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/* ================= ADD USER (Admin Only) ================= */
app.post(
  "/users",
  authenticateToken,
  requireAdmin,
  addUserRules,
  validateRequest,
  async (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (result.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query("INSERT INTO users (email, google_id, password, role) VALUES (?, ?, ?, 'user')", [email, null, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Error creating user" });
      res.json({ success: true, message: "User created successfully" });
    });
  });
});

// hello

/* ================= ADD TASK (Admin Only) ================= */
app.post(
  "/tasks",
  authenticateToken,
  requireAdmin,
  addTaskRules,
  validateRequest,
  (req, res) => {
   
  console.log("Incoming Task:", req.body);
  // ✅ FIX: Include 'priority' when creating a task.
  const { assigned_to, date, time, description, priority } = req.body;

  // ✅ FIX: Add 'priority' to the SQL INSERT statement.
  const sql = "INSERT INTO tasks (user_id, date, time, description, priority, status) VALUES (?,?,?,?, ?, 'pending')";

  db.query(sql, [assigned_to, date, time, description, priority || 'medium'], (err, result) => {
    if (err) return res.status(500).json({ success: false });

    // 🔹 Get user email
    db.query("SELECT email FROM users WHERE id=?", [assigned_to], (err, userResult) => {
      if (!err && userResult.length > 0) {

        const userEmail = userResult[0].email;

        const mailOptions = {
          from: "Task Manager <anbuselvam.sk05@gmail.com>",
          to: userEmail,
          subject: "New Task Assigned",
          text: `You have a new task:\n\n${description}\nDate: ${date}\nTime: ${time}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Email error:", error);
          } else {
            console.log("Email sent:", info.response);
          }
        });
      }
    });

    res.json({ success: true });
  });
});

/* ================= GET TASKS ================= */
app.get("/tasks", authenticateToken, (req, res) => {
  let sql;
  let params = [];

  if (req.user.role === "admin") {
    // Admin sees ALL tasks with assignee info
    sql = "SELECT t.*, u.email as assigned_user FROM tasks t JOIN users u ON t.user_id = u.id ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, t.date, t.time";
  } else {
    // User sees ONLY their tasks
    sql = "SELECT * FROM tasks WHERE user_id = ? ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, date, time";
    params = [req.user.id];
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/* ================= COMPLETE TASK ================= */
app.put("/tasks/:id/complete", authenticateToken, (req, res) => {

  const taskId = req.params.id;

  const sql = req.user.role === 'admin'
    ? "UPDATE tasks SET status='completed' WHERE id=?"
    : "UPDATE tasks SET status='completed' WHERE id=? AND user_id=?";

  const params = req.user.role === 'admin'
    ? [taskId]
    : [taskId, req.user.id];

  db.query(sql, params, (err, result) => {

    if (err) return res.status(500).json({ success: false });

    if (result.affectedRows === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    /* 🔹 GET TASK DETAILS */
    db.query(
      `SELECT t.description, t.date, t.time, u.email
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [taskId],
      (err, taskResult) => {

        if (!err && taskResult.length > 0) {

          const task = taskResult[0];

          const mailOptions = {
            from: "Task Manager <" + process.env.EMAIL_USER + ">",
            to: process.env.ADMIN_EMAIL,
            subject: "Task Completed",
            text: `
User has completed a task.

Task Description: ${task.description}
Date: ${task.date}
Time: ${task.time}

Completed by: ${task.email}
            `
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("Email error:", error);
            } else {
              console.log("Completion email sent:", info.response);
            }
          });
        }

      });

    res.json({ success: true });

  });

});
// 📊 Dashboard counts API
app.get("/dashboard/counts", authenticateToken, (req, res) => {
  let sql;
  let params = [];

  if (req.user.role === "admin") {
    sql = `SELECT COUNT(*) AS total, SUM(status = 'completed') AS completed, SUM(status = 'pending') AS pending FROM tasks`;
  } else {
    sql = `SELECT COUNT(*) AS total, SUM(status = 'completed') AS completed, SUM(status = 'pending') AS pending FROM tasks WHERE user_id = ?`;
    params = [req.user.id];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Dashboard count error:", err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json(results[0]);
  });
});

/* ================= DELETE TASK ================= */
app.delete("/tasks/:id", authenticateToken, requireAdmin, (req, res) => {
  db.query("DELETE FROM tasks WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.post(
  "/google-login",
  googleLoginRules,
  validateRequest,
  (req, res) => {
  const { email, google_id } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      console.error("Google Login DB Error:", err);
      return res.status(500).json({ success: false, message: "Database error checking user" });
    }

    // User already exists
    if (result.length > 0) {
      const user = result[0];
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
      return res.json({ success: true, token, user_id: user.id, role: user.role });
    }

    // New Google user
    db.query(
      "INSERT INTO users (email, google_id, password) VALUES (?, ?, ?)",
      [email, google_id, "GOOGLE_USER"],
      (err, insertResult) => {
        if (err) {
          console.error("Google Login Insert Error:", err);
          return res.status(500).json({ success: false, message: "Database error creating user" });
        }

        const newUser = { id: insertResult.insertId, role: "user" };
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ success: true, token, user_id: newUser.id, role: newUser.role });
      }
    );
  });
});


/* ================= TASK REMINDER SCHEDULER ================= */
cron.schedule("* * * * *", () => {

  console.log("⏳ Checking reminders...");

  const sql = `
    SELECT t.id, t.description, t.date, t.time, u.email
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.status = 'pending'
    AND (t.reminder_sent = FALSE OR t.reminder_sent IS NULL)
  `;

  db.query(sql, (err, tasks) => {

    if (err) {
      console.error("Reminder scheduler error:", err);
      return;
    }

    console.log("Tasks found:", tasks.length);

    // 🇮🇳 Current Indian Time
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    console.log("Current IST Time:", now);

    tasks.forEach(task => {

      // combine date + time
      const taskDate = new Date(task.date).toLocaleDateString("en-CA", {
  timeZone: "Asia/Kolkata"
});
      const deadline = new Date(`${taskDate}T${task.time}+05:30`);
      
      // reminder = 1 hour before deadline
      const reminderTime = new Date(deadline.getTime() - (60 * 60 * 1000));
      
      // console.log("Task:", task.description);
      // console.log("Deadline IST:", deadline);
      // console.log("Reminder Time IST:", reminderTime);

      if (now >= reminderTime && now < deadline) {

        console.log("⚡ Sending reminder email...");

        const mailOptions = {
          from: "Task Manager <" + process.env.EMAIL_USER + ">",
          to: task.email,
          subject: "⏰ Task Reminder - Deadline Approaching",
          text: `
Reminder: Your task deadline is approaching.

Task: ${task.description}

Deadline: ${taskDate} ${task.time}

Please complete your task before the deadline.
          `
        };

        transporter.sendMail(mailOptions, (error, info) => {

          if (error) {
            console.log("Reminder email error:", error);
          } else {

            console.log("✅ Reminder email sent:", info.response);

            db.query(
              "UPDATE tasks SET reminder_sent = TRUE WHERE id = ?",
              [task.id]
            );

          }

        });

      }

    });

  });

});
// 🌍 Global Error Handler

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});



app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
  console.log("✅ Successfully connected to MySQL database and started server");
});