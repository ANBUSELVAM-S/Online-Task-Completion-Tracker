const { sanitizeInput } = require("../utils/sanitization");
const Task = require("../models/Task");
const User = require("../models/User");

// ─── GET /tasks ────────────────────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      let uid = req.user.id;
      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(uid)) {
        const User = require("../models/User");
        // Convert string integer to number. It's stored as Number in mongo.
        const userRec = await User.findOne({ userId: Number(uid) });
        if (userRec) uid = userRec._id;
      }
      query.user_id = uid;
    }

    const tasks = await Task.find(query)
      .populate("user_id", "email")
      .sort({
        priority: 1, // This is tricky because priority is string. In mongo it's better to use numeric or careful sort.
        date: 1,
        time: 1,
      });

    // Custom sorting for priority if needed (high > medium > low)
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date - b.date;
      }
      return a.time.localeCompare(b.time);
    });

    // Map to match frontend expectation if necessary (e.g., user_id -> email)
    const formattedTasks = tasks.map((t) => ({
      ...t._doc,
      id: t._id,
      user_id: t.user_id && t.user_id._id ? t.user_id._id.toString() : (t.user_id ? t.user_id.toString() : null),
      date: t.date ? t.date.toISOString().split("T")[0] : null,
      assigned_user: t.user_id && typeof t.user_id === "object" ? t.user_id.email : "N/A",
    }));



    return res.json(formattedTasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch tasks." });
  }
};

// ─── POST /tasks ───────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  const transporter = req.app.get("transporter");
  const { assigned_to, date, time, description, priority } = req.body;
  const safeDesc = sanitizeInput(description);

  try {
    const task = new Task({
      user_id: assigned_to,
      date,
      time,
      description: safeDesc,
      priority: priority || "medium",
      status: "pending",
    });

    await task.save();

    // Notify assigned user via email
    const user = await User.findById(assigned_to);
    if (user && user.email) {
      const mailOptions = {
        from: `Task Manager <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "📋 New Task Assigned",
        text: `You have a new task:\n\n${safeDesc}\nDate: ${date}\nTime: ${time}\nPriority: ${priority || "medium"}`,
      };
      transporter.sendMail(mailOptions, (mailErr) => {
        if (mailErr) console.error("Task assignment email error:", mailErr);
      });
    }

    return res.json({ success: true, message: "Task created successfully." });
  } catch (err) {
    console.error("Create task error:", err);
    return res.status(500).json({ success: false, message: "Failed to create task." });
  }
};

// ─── PUT /tasks/:id/complete ───────────────────────────────────────────────────
const completeTask = async (req, res) => {
  const transporter = req.app.get("transporter");
  const taskId = req.params.id;

  try {
    let query = { _id: taskId };
    if (req.user.role !== "admin") {
      let uid = req.user.id;
      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(uid)) {
        const User = require("../models/User");
        const userRec = await User.findOne({ userId: Number(uid) });
        if (userRec) uid = userRec._id;
      }
      query.user_id = uid;
    }

    const task = await Task.findOne(query).populate("user_id", "email");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized." });
    }

    task.status = "completed";
    await task.save();

    // Email admin on task completion
    const mailOptions = {
      from: `Task Manager <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "✅ Task Completed",
      text: `A task has been completed.\n\nTask: ${task.description}\nDate: ${task.date}\nTime: ${task.time}\nCompleted by: ${task.user_id ? task.user_id.email : "Unknown"}`,
    };
    transporter.sendMail(mailOptions, (mailErr) => {
      if (mailErr) console.error("Completion email error:", mailErr);
    });

    return res.json({ success: true, message: "Task marked as completed." });
  } catch (err) {
    console.error("Complete task error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── DELETE /tasks/:id ─────────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  const taskId = req.params.id;

  try {
    const result = await Task.findByIdAndDelete(taskId);
    if (!result) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    return res.json({ success: true, message: "Task deleted successfully." });
  } catch (err) {
    console.error("Delete task error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete task." });
  }
};

module.exports = { getTasks, createTask, completeTask, deleteTask };
