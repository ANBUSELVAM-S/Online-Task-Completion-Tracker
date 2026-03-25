import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import "../styles/Task.css";
import { apiFetch } from "../utils/api";


function Task() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "" });


  const role = localStorage.getItem("role");

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch("/users");
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
    }
  }, [role, fetchUsers]);
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      if (data.success) {
        alert("✅ User added successfully");
        setNewUser({ email: "", password: "" });
        fetchUsers();
      } else {
        alert(data.message || "❌ Failed to add user");
      }
    } catch (error) {
      console.error(error);
      alert("❌ " + (error.message || "Network error"));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time || !description || !assignedTo) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ assigned_to: assignedTo, date, time, description, priority }),
      });
      if (result.success) {
        alert("✅ Task added successfully!");
        setDate(""); setTime(""); setDescription(""); setAssignedTo(""); setPriority("medium");
      } else {
        alert("❌ " + result.message);
      }
    } catch (error) {
      alert("❌ " + (error.message || "Server not responding"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (role !== "admin") {
    return (
      <div className="dashboard-layout">
        <Sidebar className="dashboard-sidebar" />
        <div className="dashboard-main">
          <h2>⛔ Access Denied</h2>
          <p>Only Admins can create tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar className="dashboard-sidebar" />
      <div className="dashboard-main">
        <div className="task-container glass-panel task-wrapper">
          <h2 className="task-heading">➕ Assign New Task</h2>

          <form className="task-form" onSubmit={handleSubmit}>
            <select className="styled-input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>

            <select className="styled-input" value={priority} onChange={e => setPriority(e.target.value)} required>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <input className="styled-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <input className="styled-input" type="time" value={time} onChange={e => setTime(e.target.value)} required />
            <textarea
              className="styled-input detailed-textarea"
              placeholder="Task description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="btn-primary mt-btn">
              {loading ? "Adding..." : "Add Task"}
            </button>
          </form>

          <h2 className="task-heading mt-header">👤 Add New User</h2>
          <form className="task-form" onSubmit={handleAddUser}>
            <input
              className="styled-input"
              type="email"
              placeholder="User Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <input
              className="styled-input"
              type="password"
              placeholder="User Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <button type="submit" className="btn-primary mt-btn">Add User</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Task;