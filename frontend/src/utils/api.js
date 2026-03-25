/**
 * Centralised API helper that:
 * 1. Automatically attaches the JWT Bearer token from localStorage.
 * 2. Detects 401 "expired" responses and redirects to /login.
 * 3. Returns parsed JSON or throws a descriptive error.
 */

const BASE_URL = "http://localhost:5000";

/**
 * @param {string} endpoint  - Path, e.g. "/tasks"
 * @param {RequestInit} options - Fetch options (method, body, etc.)
 * @returns {Promise<any>}   - Parsed JSON response
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",  // send/receive cookies (refresh token)
  });

  // Handle token expiry
  if (response.status === 401) {
    // ✋ If we are on the login or google-login endpoint, just return the error
    // so the component can handle "Invalid credentials" without redirecting.
    if (endpoint === "/login" || endpoint === "/google-login") {
      let data = {};
      try { data = await response.json(); } catch (_) { /* ignore */ }
      throw new Error(data.message || "Login failed");
    }

    let data = {};
    try { data = await response.json(); } catch (_) { /* ignore */ }

    if (data.expired) {
      // Try refreshing the access token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request once with the new token
        return apiFetch(endpoint, options);
      }
    }

    // If refresh fails or it's a non-expired 401 → force logout
    clearSession();
    window.location.href = "/";
    throw new Error("Session expired. Please log in again.");
  }

  // Parse JSON
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid server response.");
  }

  if (!response.ok) {
    throw new Error(result.message || `Server error: ${response.status}`);
  }

  return result;
}

/**
 * Attempt to refresh the access token using the HttpOnly refresh cookie.
 * Returns true if successful, false otherwise.
 */
async function tryRefreshToken() {
  try {
    const response = await fetch(`${BASE_URL}/refresh-token`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clear all session data from localStorage.
 */
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  localStorage.removeItem("loginTime");
}

export { apiFetch, clearSession };
