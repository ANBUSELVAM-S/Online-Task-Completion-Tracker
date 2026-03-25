require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

// ─── Middleware ────────────────────────────────────────────────────────────────
const { applySecurity } = require("./middleware/security");

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// ─── Validate Required Env Vars ────────────────────────────────────────────────
const REQUIRED_ENV = [
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "EMAIL_USER",
  "EMAIL_PASS",
  "ADMIN_EMAIL",
];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ FATAL: Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// ─── App Setup ─────────────────────────────────────────────────────────────────
const app = express();

// Security middleware (Helmet, CORS, Rate Limiting, Morgan)
applySecurity(app);

// Body parsers & cookie support
app.use(express.json({ limit: "10kb" }));         // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ─── Database (Connection Pool) ────────────────────────────────────────────────
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verify DB connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("✅ MySQL database connected successfully.");
  connection.release();
});

// ─── Nodemailer ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Share db & transporter via app locals ─────────────────────────────────────
app.set("db", db);
app.set("transporter", transporter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/", authRoutes);           // POST /login, /google-login, /refresh-token, /logout
app.use("/tasks", taskRoutes);      // GET/POST/PUT/DELETE /tasks
app.use("/users", userRoutes);      // GET/POST /users
app.use("/dashboard", dashboardRoutes); // GET /dashboard/counts

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server is healthy.", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("🔥 Unhandled Server Error:", err);

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred."
      : err.message;

  res.status(err.status || 500).json({ success: false, message });
});

// ─── Task Reminder Scheduler ───────────────────────────────────────────────────
cron.schedule("* * * * *", () => {
  const sql = `
    SELECT t.id, t.description, t.date, t.time, u.email
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.status = 'pending'
      AND (t.reminder_sent = FALSE OR t.reminder_sent IS NULL)
  `;

  db.query(sql, (err, tasks) => {
    if (err) {
      console.error("Reminder scheduler DB error:", err);
      return;
    }

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    tasks.forEach((task) => {
      const taskDate = new Date(task.date).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const deadline = new Date(`${taskDate}T${task.time}+05:30`);
      const reminderTime = new Date(deadline.getTime() - 60 * 60 * 1000);

      if (now >= reminderTime && now < deadline) {
        const mailOptions = {
          from: `Task Manager <${process.env.EMAIL_USER}>`,
          to: task.email,
          subject: "⏰ Task Reminder – Deadline Approaching",
          text: `Reminder: Your task deadline is approaching.\n\nTask: ${task.description}\nDeadline: ${taskDate} ${task.time}\n\nPlease complete it before the deadline.`,
        };

        transporter.sendMail(mailOptions, (mailErr, info) => {
          if (mailErr) {
            console.error("Reminder email error:", mailErr);
          } else {
            console.log("✅ Reminder sent:", info.response);
            db.query("UPDATE tasks SET reminder_sent = TRUE WHERE id = ?", [task.id]);
          }
        });
      }
    });
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});