const bcrypt = require("bcryptjs");
const { sanitizeInput } = require("../utils/sanitization");
const User = require("../models/User");
const Task = require("../models/Task");

// ─── GET /users ────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const usersRows = await User.find({ role: "user" }).select("_id email");
    const users = usersRows.map(u => ({ id: u._id, email: u.email }));
    return res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
};

// ─── POST /users ───────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const email = sanitizeInput(req.body.email);
    const { password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
      role: "user",
    });

    await newUser.save();
    return res.status(201).json({ success: true, message: "User created successfully." });
  } catch (err) {
    console.error("Create user error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /dashboard/counts ─────────────────────────────────────────────────────
const getDashboardCounts = async (req, res) => {
  try {
    let query = {};
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

    const total = await Task.countDocuments(query);
    const completed = await Task.countDocuments({ ...query, status: "completed" });
    const pending = await Task.countDocuments({ ...query, status: "pending" });

    return res.json({ total, completed, pending });
  } catch (err) {
    console.error("Dashboard counts error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch counts." });
  }
};

module.exports = { getUsers, createUser, getDashboardCounts };
