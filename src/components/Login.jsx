import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const CLIENT_ID = "553832021727-dpmp3or6t2dl9bj3iot3040kbaie4cjq.apps.googleusercontent.com";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        alert("Server error: " + response.status);
        return;
      }

      let result;

      try {
        result = await response.json();
      } catch {
        alert("Invalid server response");
        return;
      }

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user_id", result.user_id);
        localStorage.setItem("role", result.role);

        alert("Login Successful!");
        navigate("/dashboard");
      } else {
        alert(result.message || "Login failed");
      }

    } catch (err) {
      console.error("Login Error:", err);
      alert("Server error");
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      // ✅ Prevent crash if Google fails
      if (!credentialResponse?.credential) {
        alert("Google login failed: No credential received");
        return;
      }

      const decoded = jwtDecode(credentialResponse.credential);

      const googleUser = {
        email: decoded.email,
        google_id: decoded.sub
      };

      const response = await fetch("http://localhost:5000/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googleUser)
      });

      if (!response.ok) {
        alert("Server error: " + response.status);
        return;
      }

      let result;

      try {
        result = await response.json();
      } catch {
        alert("Invalid server response");
        return;
      }

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user_id", result.user_id);
        localStorage.setItem("role", result.role);

        alert("Google Login Successful!");
        navigate("/dashboard");
      } else {
        alert(result.message || "Google Login Failed");
      }

    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login Failed: " + error.message);
    }
  };

  const handleLoginError = (err) => {
    console.error("Google Login Failed:", err);
    alert("Google Login Failed. Check console for details.");
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="login-container">
        <form className="login-box" onSubmit={handleSubmit}>
          <h2 style={{ color: "white" }}>Login</h2>

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>

          <h3>Or</h3>

          <div className="google-login">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />
          </div>
        </form>
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;
