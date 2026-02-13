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
    const [newUser, setNewUser] = useState({
    email: "",
    password: ""
  });


    const token = localStorage.getItem("token");

    useEffect(() => {
      if (token) {
        fetchDashboardCounts();
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
    const handleInputChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value
    });
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        alert("User added successfully");
        setNewUser({ email: "", password: "" });
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
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
              <Bar data={barData} style={{height:"15rem"}}/>
            </div>
          </div>
          <div className="add-user-box">
    <h3>Add New User</h3>

    <input
      type="email"
      name="email"
      placeholder="User Email"
      value={newUser.email}
      onChange={handleInputChange}
    />

    <input
      type="password"
      name="password"
      placeholder="User Password"
      value={newUser.password}
      onChange={handleInputChange}
    />

    <button onClick={handleAddUser}>
      Add User
    </button>
  </div>

          
        </div>
        {/* 👤 Admin Add User Section */}

      </div>
    );
  }

  export default Dashboard;
