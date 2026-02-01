import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";
import DashboardIcon from '@mui/icons-material/Dashboard';

function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <div className="hamburger" onClick={() => setOpen(!open)}>
        ☰
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${open ? "open" : ""}`}>
        <ul>
          <h2>TaskManager</h2>
          <li onClick={() => navigate("/dashboard")}> Dashboard</li>
          <li onClick={() => navigate("/Task")}>Tasks</li>
          <li onClick={() => navigate("/Pending")}>Pending</li>
          <li onClick={() => navigate("/")}>Logout</li>
        </ul>
      </div>
    </>
  );
}

export default Sidebar;
