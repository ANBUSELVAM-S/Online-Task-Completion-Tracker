import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddTaskIcon from '@mui/icons-material/AddTask';
import DownloadingIcon from '@mui/icons-material/Downloading';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';

function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };



  return (
    <>
      {/* Hamburger Button */}
      <div className="hamburger" onClick={() => setOpen(!open)} >
        ☰
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${open ? "open" : ""}`}>
        <ul>
          <h2 className="manager">TaskManager</h2>
          <li onClick={() => navigate("/dashboard")}><DashboardIcon  /> Dashboard</li>
          {role === "admin" && (
            <li onClick={() => navigate("/Task")}><AssignmentIcon/> Tasks</li>
          )}
          {role === "admin" && (
            <li onClick={() => navigate("/userTasks")}><PeopleIcon /> Users</li>
          )}
          <li onClick={() => navigate("/Completed")}><AddTaskIcon  /> Completed</li>
          <li onClick={() => navigate("/Pending")}><DownloadingIcon /> Pending</li>
          <li onClick={handleLogout}><LogoutIcon /> Logout</li>
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
