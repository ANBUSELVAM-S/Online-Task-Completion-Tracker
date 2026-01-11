import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/Dashboard.css";

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
  const [counts, setCounts] = useState({
    total: 0,
    completed: 0,
    pending: 0
  });

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (userId) {
      fetchDashboardCounts();
    }
  }, [userId]);

  const fetchDashboardCounts = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/dashboard/counts?user_id=${userId}`
      );
      const data = await response.json();
      setCounts(data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  const pieData = {
    labels: ["Completed", "Pending"],
    datasets: [
      {
        data: [counts.completed, counts.pending],
        backgroundColor: ["#28a745", "#ffc107"]
      }
    ]
  };

  const barData = {
    labels: ["Total", "Completed", "Pending"],
    datasets: [
      {
        label: "Tasks",
        data: [counts.total, counts.completed, counts.pending],
        backgroundColor: ["#007bff", "#28a745", "#ffc107"]
      }
    ]
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="cards">
          <div className="card">
            <h3>Total Tasks</h3>
            <p>{counts.total}</p>
          </div>
          <div className="card">
            <h3>Completed</h3>
            <p>{counts.completed}</p>
          </div>
          <div className="card">
            <h3>Pending</h3>
            <p>{counts.pending}</p>
          </div>
        </div>

        {/* 📊 Charts Section */}
        <div className="chart-box">
          <div className="chart-title">
            <h3 className="piedata">Task Status (Pie)</h3>
            <Pie data={pieData} />
          </div>

          <div className="chart-title">
            <h3 className="piedata">Task Overview (Bar)</h3>
            <Bar data={barData} style={{height:"10rem"}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
