import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Sidebar.css";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddTaskIcon from '@mui/icons-material/AddTask';
import DownloadingIcon from '@mui/icons-material/Downloading';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

function Sidebar({ className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname.toLowerCase() === path.toLowerCase() ? "active" : "";
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className={`hamburger ${open ? 'active' : ''}`} onClick={() => setOpen(!open)}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      {/* Sidebar background overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)}></div>}

      {/* Sidebar */}
      <nav className={`sidebar ${open ? "open" : ""} ${className}`}>
        <div className="sidebar-header">
          <div className="logo-icon">
            <TaskAltIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
          </div>
          <h2 className="manager">TaskManager</h2>
        </div>

        <div className="sidebar-menu">
          <ul className="menu-list">
            <li className={`menu-item ${isActive('/dashboard')}`} onClick={() => { navigate("/dashboard"); setOpen(false); }}>
              <DashboardIcon className="menu-icon" /> <span>Dashboard</span>
            </li>

            {role === "admin" && (
              <>

                <li className={`menu-item ${isActive('/Task')}`} onClick={() => { navigate("/Task"); setOpen(false); }}>
                  <AssignmentIcon className="menu-icon" /> <span>Manage Tasks</span>
                </li>
                <li className={`menu-item ${isActive('/userTasks')}`} onClick={() => { navigate("/userTasks"); setOpen(false); }}>
                  <PeopleIcon className="menu-icon" /> <span>Manage Users</span>
                </li>
              </>
            )}

            
            <li className={`menu-item ${isActive('/Completed')}`} onClick={() => { navigate("/Completed"); setOpen(false); }}>
              <AddTaskIcon className="menu-icon" /> <span>Completed</span>
            </li>
            <li className={`menu-item ${isActive('/Pending')}`} onClick={() => { navigate("/Pending"); setOpen(false); }}>
              <DownloadingIcon className="menu-icon" /> <span>Pending</span>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="logout-button" onClick={handleLogout}>
            <LogoutIcon className="menu-icon" /> <span>Logout</span>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
