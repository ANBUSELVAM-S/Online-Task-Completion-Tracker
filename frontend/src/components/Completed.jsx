import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../styles/Pending.css";

function Completed() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

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

  // ⏱ Time remaining until deadline
  const getTimeRemaining = (date, time) => {
    const deadline = new Date(`${date}T${time}`);
    const now = new Date();
    const diffMs = deadline - now;

    const absMs = Math.abs(diffMs);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

    const formatted = `${hours}h ${minutes}m`;

  };

  // 🔍 Filter Tasks based on Search + Priority
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assigned_user && task.assigned_user.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority =
      priorityFilter === "all" ||
      task.priority?.toLowerCase() === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const getPriorityClass = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'high') return 'priority-high';
    if (p === 'medium') return 'priority-medium';
    if (p === 'low') return 'priority-low';
    return '';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar className="dashboard-sidebar" />

      <div className="dashboard-main">
        <div className="pending-container glass-panel pending-wrapper">
          <h1 className="pending-title">✅ {role === "admin" ? "All Completed Tasks" : "My Completed Tasks"}</h1>

          <div className="controls controls-wrapper">
            <input
              type="text"
              placeholder="🔍 Search completed tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="styled-input flex-1"
            />

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="styled-input filter-dropdown"
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : tasks.length === 0 ? (
            <div className="empty-box glass-panel empty-box-card">
              <p className="empty-title">No completed tasks yet 🎉</p>
            </div>
          ) : (
            <ul className="task-list task-list-flex">
              {filteredTasks.map(task => (
                <li key={task.id} className="task-card glass-panel task-card-item task-border-completed" onClick={() => openTaskPopup(task)}>
                  <div className="task-datetime task-meta">
                    📅 {new Date(task.date).toLocaleDateString("en-IN")}
                    <span className="time-remaining time-left">{getTimeRemaining(task.date, task.time)}</span>
                  </div>

                  <div className="task-desc task-description">
                    {role === "admin" && <strong className="assigned-badge">[Assigned to: {task.assigned_user}] </strong>}
                    {task.description}
                  </div>

                  <div className={`task-priority ${getPriorityClass(task.priority)} task-status-bar`}>
                    Priority: {task.priority || 'Medium'}
                  </div>

                  <div className="task-actions action-buttons">
                    {role === "admin" && (
                      <button className="btn-danger btn-auto-width" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
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
          <div className="popup-modal-overlay popup-overlay" onClick={closePopup}>
            <div className="popup-card glass-panel popup-modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="popup-title">📌 Task Details</h2>
              <p><strong>Description:</strong> {selectedTask.description}</p>
              <p><strong>Date:</strong> {selectedTask.date}</p>
              <p><strong>Time:</strong> {selectedTask.time}</p>
              <p><strong>Status:</strong> {selectedTask.status}</p>
              <p><strong>Priority:</strong> <span className={`task-priority ${getPriorityClass(selectedTask.priority)} capitalize`}>{selectedTask.priority || 'Medium'}</span></p>

              <div className="task-actions popup-actions">
                <button className="btn-primary btn-gray" onClick={closePopup}>Close</button>
                {role === "admin" && (
                  <button
                    className="btn-danger btn-danger-flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(selectedTask.id);
                      closePopup();
                    }}
                  >
                    ❌ Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Completed;