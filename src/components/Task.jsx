import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../styles/Task.css";

function Task() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !time || !description) {
      alert("Please fill all fields");
      return;
    }

    if (!userId) {
      alert("Please login first");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
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

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="task-container">
        <h2>➕ Add New Task</h2>

        <p className="user-id">👤 User ID: {userId}</p>

        <form className="task-form" onSubmit={handleSubmit}>
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
      </div>
    </div>
  );
}

export default Task;
