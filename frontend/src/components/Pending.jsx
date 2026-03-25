import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../styles/Pending.css";
import { apiFetch } from "../utils/api";


function Pending() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const role = localStorage.getItem("role");

  // ⏱ current date & time
  // ⏱ Indian current date & time
  const now = new Date();

  const todayDate = now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });

  const currentTime = now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const openTaskPopup = (task) => {
    setSelectedTask(task);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedTask(null);
  };


  useEffect(() => {
    fetchTasks();
  }, []);

  // ✅ FETCH ONLY PENDING TASKS
  const fetchTasks = async () => {
    try {
      const data = await apiFetch("/tasks");
      setTasks(data.filter(task => task.status === "pending"));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ COMPLETE TASK
  const completeTask = async (id) => {
    try {
      await apiFetch(`/tasks/${id}/complete`, { method: "PUT" });
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error("Complete task error:", err);
      alert("Failed to complete task.");
    }
  };

  // ✅ DELETE TASK
  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete task.");
    }
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

  // ⚠️ Check if task is overdue
  const isOverdue = (date, time) => {
    const taskTime = new Date(`${date}T${time}`);
    return taskTime < new Date();
  };

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
          <h1 className="pending-title">📋 {role === "admin" ? "All Pending Tasks" : "My Pending Tasks"}</h1>

          <div className="controls controls-wrapper">
            <input
              type="text"
              placeholder="🔍 Search by description or user..."
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
              <p className="empty-title">No pending tasks 🎉</p>
              <p className="empty-sub empty-subtitle">
                Add tasks from <strong>Task</strong> page
              </p>
            </div>
          ) : (
            <ul className="task-list task-list-flex">
              {filteredTasks.map(task => {
                const overdue = isOverdue(task.date, task.time);
                return (
                  <li
                    key={task.id}
                    className={`task-card glass-panel task-card-item ${overdue ? "task-border-overdue" : "task-border-normal"}`}
                    onClick={() => openTaskPopup(task)}
                  >


                    <div className="task-datetime task-meta">
                      {overdue && <span className="overdue-badge">⚠️ Overdue</span>}{" "}
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
                      <button
                        className="btn-primary btn-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeTask(task.id);
                        }}
                      >
                        ✅ Completed
                      </button>

                      {role === "admin" && (
                        <button
                          className="btn-danger btn-auto-width"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                        >
                          ❌ Delete
                        </button>
                      )}
                    </div>

                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {showPopup && selectedTask && (
          <div className="popup-modal-overlay popup-overlay" onClick={closePopup}>
            <div className="popup-card glass-panel popup-modal-card" onClick={(e) => e.stopPropagation()}>

              <h2 className="popup-title">📌 Task Details</h2>

              <p><strong>Description:</strong> {selectedTask.description}</p>
              <p><strong>Date:</strong> {selectedTask.date}</p>
              <p><strong>Time:</strong> {new Date(`1970-01-01T${selectedTask.time}`).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })}</p>
              <p><strong>Status:</strong> {selectedTask.status}</p>
              <p><strong>Priority:</strong> <span className={`task-priority ${getPriorityClass(selectedTask.priority)} capitalize`}>{selectedTask.priority || 'Medium'}</span></p>
              <p><strong>Assigned by:</strong> Admin</p>

              <div className="task-actions popup-actions">
                <button className="btn-primary btn-gray" onClick={closePopup}>
                  Close
                </button>
                <button
                  className="btn-primary btn-success-flex"
                  onClick={(e) => {
                    e.stopPropagation();
                    completeTask(selectedTask.id);
                    closePopup();
                  }}
                >
                  ✅ Completed
                </button>

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

export default Pending;
