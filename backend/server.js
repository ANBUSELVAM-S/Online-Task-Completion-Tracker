require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

// ─── Models ──────────────────────────────────────────────────────────────────
const Task = require("./models/Task");
const User = require("./models/User");

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
  "MONGODB_URI",
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

// ─── Database (MongoDB with Mongoose) ──────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully."))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ─── Nodemailer ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // must be true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Share transporter via app locals ──────────────────────────────────────────
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
cron.schedule("* * * * *", async () => {
  try {
    const tasks = await Task.find({
      status: "pending",
      $or: [{ reminder_sent: false }, { reminder_sent: { $exists: false } }],
    }).populate("user_id", "email");

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    for (const task of tasks) {
      if (!task.user_id) continue;

      const taskDateStr = new Date(task.date).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const deadline = new Date(`${taskDateStr}T${task.time}+05:30`);
      const reminderTime = new Date(deadline.getTime() - 60 * 60 * 1000); // 1 hour before

      if (now >= reminderTime && now < deadline) {
        const mailOptions = {
          from: `Task Manager <${process.env.EMAIL_USER}>`,
          to: task.user_id.email,
          subject: "⏰ Task Reminder – Deadline Approaching",
          text: `Reminder: Your task deadline is approaching.\n\nTask: ${task.description}\nDeadline: ${taskDateStr} ${task.time}\n\nPlease complete it before the deadline.`,
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`✅ Reminder sent to: ${task.user_id.email}`);
          task.reminder_sent = true;
          await task.save();
        } catch (mailErr) {
          console.error("Reminder email error:", mailErr);
        }
      }
    }
  } catch (err) {
    console.error("Reminder scheduler error:", err);
  }
});


// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});
