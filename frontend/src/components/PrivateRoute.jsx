import { Navigate } from "react-router-dom";

/**
 * PrivateRoute – redirects unauthenticated users to the login page.
 * Optionally accepts a `requiredRole` prop for role-based access control.
 */
function PrivateRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // No token → send to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required, enforce it
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PrivateRoute;
