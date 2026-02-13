import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddTaskIcon from '@mui/icons-material/AddTask';
import DownloadingIcon from '@mui/icons-material/Downloading';
import LogoutIcon from '@mui/icons-material/Logout';

function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    navigate("/");
  };



  return (
    <>
      {/* Hamburger Button */}
      <div className="hamburger" onClick={() => setOpen(!open)} >
        ☰
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${open ? "open" : ""}`} style={{height:"93.5vh"}}>
        <ul>
          <h2>TaskManager</h2>
          <li onClick={() => navigate("/dashboard")}><DashboardIcon style={{ fontSize: 20,paddingRight:"4rem" }} /> Dashboard</li>
          <li onClick={() => navigate("/Task")}><AssignmentIcon style={{ fontSize: 20,paddingRight:"6rem" }} /> Tasks</li>
          <li onClick={() => navigate("/Completed")}><AddTaskIcon style={{ fontSize: 20,paddingRight:"4rem" }} /> Completed</li>
          <li onClick={() => navigate("/Pending")}><DownloadingIcon style={{ fontSize: 20,paddingRight:"5rem" }} /> Pending</li>
          <li onClick={handleLogout}><LogoutIcon style={{ fontSize: 20 ,paddingRight:"5rem"}} /> Logout</li>
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
