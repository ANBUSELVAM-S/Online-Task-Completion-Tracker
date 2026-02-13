import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Loginpage";
import DashboardPage from "./pages/DashboardPage";
import TaskPage from "./pages/TaskPage";
import PendingPage from "./pages/PendingPage";
import AdminRoute from "./components/AdminRoute";
import Completed from "./components/Completed";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 🔒 Admin-only */}
        <Route
          path="/Task"
          element={
            <AdminRoute>
              <TaskPage />
            </AdminRoute>
          }
        />

        <Route path="/Pending" element={<PendingPage />} />
        <Route path="/Completed" element={<Completed />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
