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
      <div className="dashboards">
        <Sidebar />
        <div className="pending-container">
          <h2>⛔ Access Denied</h2>
          <p>Only Admins can view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboards">
      <Sidebar />
      <div className="pending-container usertasks-layout">

        {/* Left panel — Users list */}
        <div className="usertasks-users-panel">
          <h1 className="pending-title">👥 Users</h1>
          {loadingUsers ? (
            <p className="loading-text">Loading users...</p>
          ) : (
            <ul className="task-list">
              {users.map((user) => (
                <li
                  key={user.id}
                  className={`task-card usertasks-user-item ${
                    selectedUser?.id === user.id ? "usertasks-user-active" : ""
                  }`}
                  onClick={() => handleUserClick(user)}
                >
                  {user.email}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right panel — Tasks for selected user */}
        <div className="usertasks-tasks-panel">
          <h1 className="pending-title">
            {selectedUser
              ? `Tasks for ${selectedUser.email}`
              : "Select a user to see their tasks"}
          </h1>

          {loadingTasks ? (
            <p className="loading-text">Loading tasks...</p>
          ) : !selectedUser ? (
            <div className="empty-box">
              <p>Please select a user from the list.</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-box">
              <p>No tasks assigned to this user. 🎉</p>
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-card ${
                    task.status === "completed"
                      ? "usertasks-border-completed"
                      : "usertasks-border-pending"
                  }`}
                >
                  <div className="task-datetime">
                    📅 {new Date(task.date).toLocaleDateString("en-IN")} ⏰{" "}
                    {new Date(`1970-01-01T${task.time}`).toLocaleTimeString(
                      "en-IN",
                      { hour: "2-digit", minute: "2-digit", hour12: true }
                    )}
                  </div>
                  <div className="task-desc">{task.description}</div>
                  <div
                    className={`usertasks-status ${
                      task.status === "completed"
                        ? "usertasks-status-completed"
                        : "usertasks-status-pending"
                    }`}
                  >
                    Status: {task.status}
                  </div>
                  <div
                    className={`task-priority ${getPriorityClass(task.priority)} usertasks-priority`}
                  >
                    Priority: {task.priority || "Medium"}
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