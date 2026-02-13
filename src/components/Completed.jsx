import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../styles/Pending.css";

function Completed() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const openTaskPopup = (task) => {
    setSelectedTask(task);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedTask(null);
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/tasks`, {
          headers: { "Authorization": `Bearer ${token}` }
        }
      );
      const data = await res.json();

      // Filter completed only
      const completedTasks = data.filter(
        task => task.status === "completed"
      );

      setTasks(completedTasks);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;

    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="dashboards">
      <Sidebar />

      <div className="pending-container">
        <h1 className="pending-title">✅ {role === "admin" ? "All Completed Tasks" : "My Completed Tasks"}</h1>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="empty-box">
            <p>No completed tasks yet 🎉</p>
          </div>
        ) : (
          <ul className="task-list" style={{ height: "80vh", overflowY: "auto" }}>
            {tasks.map(task => (
              <li key={task.id} className="task-card" onClick={() => openTaskPopup(task)}>
                <div className="task-datetime">
                  📅 {task.date} ⏰ {task.time}
                </div>

                <div className="task-desc">
                  {role === "admin" && <strong>[Assigned to: {task.assigned_user}] </strong>}
                  {task.description}
                </div>

                <div className="task-actions">
                  {role === "admin" && (
                    <button className="btn-delete" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
                      ❌ Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPopup && selectedTask && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <h2>📌 Task Details</h2>
            <p><strong>Description:</strong> {selectedTask.description}</p>
            <p><strong>Date:</strong> {selectedTask.date}</p>
            <p><strong>Time:</strong> {selectedTask.time}</p>
            <p><strong>Status:</strong> {selectedTask.status}</p>
            <button className="btn-close" onClick={closePopup}>Close</button>
            {role === "admin" && (
    <button
      className="btn-delete"
      onClick={(e) => {
        e.stopPropagation();
        deleteTask(selectedTask.id);
        closePopup();
      }} style={{marginTop:"0.5rem",width:"100%"}}
    >
      ❌ Delete
    </button>
  )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Completed;