import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "../styles/UserTasks.css";

function UserTasks() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role === "admin" && token) {
      fetchUsers();
    } else {
      setLoadingUsers(false);
    }
  }, [role, token]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("http://localhost:5000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setLoadingTasks(true);
    setTasks([]);
    try {
      const res = await fetch(`http://localhost:5000/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allTasks = await res.json();
      const userTasks = allTasks.filter((task) => task.user_id === user.id);
      const sortedTasks = sortTasksByPriority(userTasks);
      setTasks(sortedTasks);
    } catch (err) {
      console.error(`Failed to fetch tasks for user ${user.id}`, err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const sortTasksByPriority = (tasks) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return tasks.sort(
      (a, b) =>
        priorityOrder[a.priority?.toLowerCase()] -
        priorityOrder[b.priority?.toLowerCase()]
    );
  };

  const getPriorityClass = (priority) => {
    const p = priority?.toLowerCase();
    if (p === "high") return "priority-high";
    if (p === "medium") return "priority-medium";
    if (p === "low") return "priority-low";
    return "";
  };

  if (role !== "admin") {
    return (
      <div className="dashboard-layout">
        <Sidebar className="dashboard-sidebar" />
        <div className="dashboard-main">
          <h2>⛔ Access Denied</h2>
          <p>Only Admins can view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar className="dashboard-sidebar" />
      <div className="dashboard-main main-flex-container">

        {/* Left panel — Users list */}
        <div className="usertasks-users-panel glass-panel users-panel-wrapper">
          <h1 className="pending-title panel-header">👥 Users</h1>
          {loadingUsers ? (
            <p className="loading-text">Loading users...</p>
          ) : (
            <ul className="task-list users-list">
              {users.map((user) => (
                <li
                  key={user.id}
                  className={`task-card user-list-item ${selectedUser?.id === user.id ? "user-list-item-active" : "user-list-item-inactive"}`}
                  onClick={() => handleUserClick(user)}
                >
                  {user.email}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right panel — Tasks for selected user */}
        <div className="usertasks-tasks-panel glass-panel tasks-panel-wrapper">
          <h1 className="pending-title panel-header">
            {selectedUser
              ? `Tasks for ${selectedUser.email}`
              : "Select a user to see their tasks"}
          </h1>

          {loadingTasks ? (
            <p className="loading-text">Loading tasks...</p>
          ) : !selectedUser ? (
            <div className="empty-box tasks-empty-state">
              <p>Please select a user from the list.</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-box tasks-empty-state">
              <p>No tasks assigned to this user. 🎉</p>
            </div>
          ) : (
            <ul className="task-list tasks-list-flex">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-card glass-panel task-card-item ${task.status === "completed" ? "task-card-item-completed" : "task-card-item-pending"}`}
                >
                  <div className="task-datetime usertask-datetime">
                    📅 {new Date(task.date).toLocaleDateString("en-IN")} ⏰{" "}
                    {new Date(`1970-01-01T${task.time}`).toLocaleTimeString(
                      "en-IN",
                      { hour: "2-digit", minute: "2-digit", hour12: true }
                    )}
                  </div>
                  <div className="task-desc usertask-title">{task.description}</div>

                  <div className="usertask-badges">
                    <div className={`usertasks-status status-badge ${task.status === "completed" ? "status-badge-completed" : "status-badge-pending"}`}>
                      Status: {task.status}
                    </div>

                    <div className={`task-priority priority-badge-static ${getPriorityClass(task.priority)}`}>
                      Priority: {task.priority || "Medium"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserTasks;