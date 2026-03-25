import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Loginpage";
import DashboardPage from "./pages/DashboardPage";
import TaskPage from "./pages/TaskPage";
import PendingPage from "./pages/PendingPage";
import Completed from "./components/Completed";
import UserTasks from "./components/UserTasks";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected – any authenticated user */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/Pending"
          element={
            <PrivateRoute>
              <PendingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/Completed"
          element={
            <PrivateRoute>
              <Completed />
            </PrivateRoute>
          }
        />

        {/* Protected – Admin only */}
        <Route
          path="/Task"
          element={
            <PrivateRoute requiredRole="admin">
              <TaskPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/userTasks"
          element={
            <PrivateRoute requiredRole="admin">
              <UserTasks />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
