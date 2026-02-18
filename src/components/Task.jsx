import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../styles/Task.css";


function Task() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "" });

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleAddUser = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:5000/users", {  // ✅ FIXED URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(newUser)
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      if (response.ok) {
        alert("✅ User added successfully");
        setNewUser({ email: "", password: "" });
        fetchUsers();
      } else {
        alert(data.message || "❌ Failed to add user");
      }
    } else {
      const text = await response.text();
      console.error("Server response:", text);
      alert(`Server Error: ${response.status}`);
    }

  } catch (error) {
    console.error(error);
    alert("❌ Network error or Server not reachable");
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !time || !description || !assignedTo) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/tasks", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          assigned_to: assignedTo,
          date,
          time,
          description
        })
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Task added successfully!");
        setDate("");
        setTime("");
        setDescription("");
      } else {
        alert("❌ " + result.message);
      }
    } catch (error) {
      alert("❌ Server not responding");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (role !== "admin") {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="task-container">
          <h2>⛔ Access Denied</h2>
          <p>Only Admins can create tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{height:"97.5vh"}}>
      <Sidebar />
      <div className="task-container">
        <h2 className="task-heading">➕ Assign New Task</h2>

        <form className="task-form" onSubmit={handleSubmit}>
          <select className="option" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
            <option value="">Select User</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>

          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          <textarea
            placeholder="Task description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Task"}
          </button>
        </form>

        <h2 className="task-heading" >👤 Add New User</h2>
        <form className="task-form" onSubmit={handleAddUser}>
          <input
            type="email"
            placeholder="User Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="User Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <button type="submit">Add User</button>
        </form>
      </div>
    </div>
  );
}

export default Task;