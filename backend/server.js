const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Anbusathish@27",
  database: "login_db"
});

db.connect(err => {
  if (err) console.log("❌ DB Error", err);
  else console.log("✅ MySQL Connected");
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ success: false });

      if (result.length === 0) {
        return res.json({ success: false, message: "Invalid email" });
      }

      const user = result[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.json({ success: false, message: "Wrong password" });
      }

      res.json({
        success: true,
        user_id: user.id
      });
    }
  );
});

/* ================= ADD TASK ================= */
app.post("/tasks", (req, res) => {
  const { user_id, date, time, description } = req.body;

  if (!user_id) {
    return res.status(400).json({ success: false, message: "user_id required" });
  }

  const sql =
    "INSERT INTO tasks (user_id, date, time, description, status) VALUES (?,?,?,?, 'pending')";

  db.query(sql, [user_id, date, time, description], (err, result) => {
    if (err) return res.status(500).json({ success: false });

    res.json({ success: true });
  });
});

/* ================= GET TASKS ================= */
app.get("/tasks", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "user_id required" });
  }

  db.query(
    "SELECT * FROM tasks WHERE user_id = ? AND status='pending' ORDER BY date, time",
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

/* ================= COMPLETE TASK ================= */
app.put("/tasks/:id/complete", (req, res) => {
  db.query(
    "UPDATE tasks SET status='completed' WHERE id=?",
    [req.params.id],
    err => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    }
  );
});

// 📊 Dashboard counts API
app.get("/dashboard/counts", (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const sql = `
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'completed') AS completed,
      SUM(status = 'pending') AS pending
    FROM tasks
    WHERE user_id = ?
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Dashboard count error:", err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json(results[0]);
  });
});

/* ================= DELETE TASK ================= */
app.delete("/tasks/:id", (req, res) => {
  db.query("DELETE FROM tasks WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.post("/google-login", (req, res) => {
  const { email, google_id } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });

    // User already exists
    if (result.length > 0) {
      return res.json({ user_id: result[0].id });
    }

    // New Google user
    db.query(
      "INSERT INTO users (email, google_id, password) VALUES (?, ?, ?)",
      [email, google_id, "GOOGLE_USER"],
      (err, insertResult) => {
        if (err) return res.status(500).json({ error: "Insert failed" });

        res.json({ user_id: insertResult.insertId });
      }
    );
  });
});



app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});