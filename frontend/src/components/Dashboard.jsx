import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/Dashboard.css";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    total: 0,
    completed: 0,
    pending: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState([]);


  const [showProfile, setShowProfile] = useState(false);
  const userEmail = localStorage.getItem("email");
  const loginTime = localStorage.getItem("loginTime");
  const role = localStorage.getItem("role") || "user";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetchDashboardCounts();
      fetchUpcomingTasks();
    }
  }, [token]);

  const fetchDashboardCounts = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/dashboard/counts`, {
        headers: { "Authorization": `Bearer ${token}` }
      }
      );
      const data = await response.json();
      setCounts(data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  const fetchUpcomingTasks = async () => {
    try {
      const response = await fetch(`http://localhost:5000/tasks`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        // Filter pending and sort by date/time
        const pending = data.filter(t => t.status === "pending");
        pending.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA - dateB;
        });
        setUpcomingTasks(pending.slice(0, 4)); // Show top 4 upcoming
      }
    } catch (error) {
      console.error("Tasks fetch error:", error);
    }
  };



  const pieData = {
    labels: ["Completed", "Pending"],
    datasets: [
      {
        data: [counts.completed, counts.pending],
        backgroundColor: ["#10b981", "#f59e0b"],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const barData = {
    labels: ["Total", "Completed", "Pending"],
    datasets: [
      {
        label: "Tasks",
        data: [counts.total, counts.completed, counts.pending],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderRadius: 6,
      }
    ]
  };

  const pieOptions = {
    plugins: { legend: { position: 'bottom', labels: { color: '#4b5563', font: { family: 'Inter' } } } },
    cutout: '65%'
  };

  const barOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } },
      x: { grid: { display: false }, ticks: { color: '#6b7280' } }
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar className="dashboard-sidebar" />
      <div className="dashboard-main">
        {/* Top Header */}
        <div className="dashboard-header">
          <div className="header-greeting">
            <h2>Welcome back, <span>{role === 'admin' ? 'Admin' : 'User'}</span> 👋</h2>
            <p>Here's what's happening with your tasks today.</p>
          </div>

          <div className="profile-container">
            <div
              onClick={() => setShowProfile(!showProfile)}
              className="profile-icon glass-icon"
              title="User Profile"
            >
              <AccountCircleIcon className="account-icon" />
            </div>

            {showProfile && (
              <div className="profile-dropdown glass-panel">
                <div className="profile-info-hdr">
                  <AccountCircleIcon style={{ fontSize: 40, color: '#3b82f6' }} />
                  <div>
                    <p className="profile-email">{userEmail || "User"}</p>
                    <span className="profile-badge">{role.toUpperCase()}</span>
                  </div>
                </div>
                <div className="profile-divider"></div>
                <p className="profile-time">🕒 Login: {loginTime}</p>
                <button
                  className="logout-btn btn-danger"
                  onClick={() => {
                    localStorage.clear();
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-content">
          {/* Left Column */}
          <div className="dashboard-col-left">
            {/* KPI Cards */}
            <div className="kpi-cards">
              <div className="kpi-card glass-panel kpi-total">
                <div className="kpi-icon total-icon">📊</div>
                <div className="kpi-details">
                  <h3>Total Tasks</h3>
                  <p className="kpi-number">{counts.total}</p>
                </div>
              </div>
              <div className="kpi-card glass-panel kpi-completed">
                <div className="kpi-icon completed-icon">✅</div>
                <div className="kpi-details">
                  <h3>Completed</h3>
                  <p className="kpi-number">{counts.completed}</p>
                </div>
              </div>
              <div className="kpi-card glass-panel kpi-pending">
                <div className="kpi-icon pending-icon">⏳</div>
                <div className="kpi-details">
                  <h3>Pending</h3>
                  <p className="kpi-number">{counts.pending}</p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card glass-panel">
                <h3 className="chart-title">Task Overview</h3>
                <div className="chart-wrapper bar-chart-wrapper">
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>

              <div className="chart-card glass-panel">
                <h3 className="chart-title">Status Breakdown</h3>
                <div className="chart-wrapper pie-chart-wrapper">
                  <Pie data={pieData} options={pieOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-col-right">
            {/* NEW FEATURE: Upcoming Deadlines Widget */}
            <div className="upcoming-widget glass-panel">
              <div className="widget-header">
                <h3>🚀 Upcoming Deadlines</h3>
                {upcomingTasks.length > 0 && <span className="badge-count">{upcomingTasks.length}</span>}
              </div>

              <div className="upcoming-list">
                {upcomingTasks.length === 0 ? (
                  <div className="no-tasks-msg">
                    <p>No upcoming tasks. You're all caught up! 🎉</p>
                  </div>
                ) : (
                  upcomingTasks.map(task => {
                    // Format date properly
                    const dateObj = new Date(task.date);
                    const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={task.id} className="upcoming-item">
                        <div className={`priority-indicator pr-${task.priority || 'medium'}`}></div>
                        <div className="upcoming-details">
                          <h4>{task.description}</h4>
                          <div className="upcoming-meta">
                            <span><CalendarMonthIcon fontSize="small" /> {formattedDate}</span>
                            <span><AccessTimeIcon fontSize="small" /> {task.time}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
