import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { apiFetch } from "../utils/api";

const CLIENT_ID = "553832021727-dpmp3or6t2dl9bj3iot3040kbaie4cjq.apps.googleusercontent.com";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "Logging in...", type: "info" });

    try {
      const result = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user_id", result.user_id);
        localStorage.setItem("role", result.role);
        localStorage.setItem("email", result.email || email);
        localStorage.setItem("loginTime", new Date().toLocaleString());

        setMessage({ text: "Login Successful!", type: "success" });
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setMessage({ text: err.message || "Login failed", type: "error" });
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        setMessage({ text: "Google login failed: No credential received", type: "error" });
        return;
      }
      setMessage({ text: "Verifying Google account...", type: "info" });
      const decoded = jwtDecode(credentialResponse.credential);
      const googleUser = { email: decoded.email, google_id: decoded.sub };

      const result = await apiFetch("/google-login", {
        method: "POST",
        body: JSON.stringify(googleUser),
      });

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user_id", result.user_id);
        localStorage.setItem("role", result.role);
        localStorage.setItem("email", googleUser.email);
        localStorage.setItem("loginTime", new Date().toLocaleString());

        setMessage({ text: "Google Login Successful!", type: "success" });
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      setMessage({ text: error.message || "Google Login Failed", type: "error" });
    }
  };

  const handleLoginError = (err) => {
    console.error("Google Login Failed:", err);
    setMessage({ text: "Google Login Failed. Check console for details.", type: "error" });
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="login-container">
        <form className="login-box" onSubmit={handleSubmit}>
          <h2 style={{ color: "white" }}>Login</h2>

          {message.text && (
            <div className={`login-message ${message.type}`}>
              {message.text}
            </div>
          )}

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


