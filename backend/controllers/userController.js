const bcrypt = require("bcryptjs");
const { sanitizeInput } = require("../utils/sanitization");

// ─── GET /users ────────────────────────────────────────────────────────────────
const getUsers = (db) => (req, res) => {
  db.query("SELECT id, email FROM users WHERE role = 'user'", (err, results) => {
    if (err) {
      console.error("Get users error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch users." });
    }
    return res.json(results);
  });
};

// ─── POST /users ───────────────────────────────────────────────────────────────
const createUser = (db) => async (req, res) => {
  try {
    const email = sanitizeInput(req.body.email);
    const { password } = req.body;

    db.query("SELECT id FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) {
        console.error("Create user DB error:", err);
        return res.status(500).json({ success: false, message: "Database error." });
      }
      if (result.length > 0) {
        return res.status(400).json({ success: false, message: "User already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      db.query(
        "INSERT INTO users (email, google_id, password, role) VALUES (?, NULL, ?, 'user')",
        [email, hashedPassword],
        (err) => {
          if (err) {
            console.error("Insert user error:", err);
            return res.status(500).json({ success: false, message: "Error creating user." });
          }
          return res.status(201).json({ success: true, message: "User created successfully." });
        }
      );
    });
  } catch (err) {
    console.error("Create user controller error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /dashboard/counts ─────────────────────────────────────────────────────
const getDashboardCounts = (db) => (req, res) => {
  let sql, params = [];

  if (req.user.role === "admin") {
    sql = `SELECT COUNT(*) AS total,
                  SUM(status = 'completed') AS completed,
                  SUM(status = 'pending') AS pending
           FROM tasks`;
  } else {
    sql = `SELECT COUNT(*) AS total,
                  SUM(status = 'completed') AS completed,
                  SUM(status = 'pending') AS pending
           FROM tasks WHERE user_id = ?`;
    params = [req.user.id];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Dashboard count error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch counts." });
    }
    return res.json(results[0]);
  });
};

module.exports = { getUsers, createUser, getDashboardCounts };
