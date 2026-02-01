import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider,GoogleLogin } from "@react-oauth/google";

const CLIENT_ID = "553832021727-dpmp3or6t2dl9bj3iot3040kbaie4cjq.apps.googleusercontent.com"; // replace with your own client ID

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

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("user_id", result.user_id);
      navigate("/dashboard");
    } else {
      alert(result.message);
    }

  } catch (err) {
    alert("Server error");
    console.error(err);
  }
};

  const handleLoginSuccess = (credentialResponse) => {
  console.log("Google Login Success:", credentialResponse);

  // (Optional) store token
  localStorage.setItem("google_token", credentialResponse.credential);

  alert("Google Login Successful!");

  // ✅ Correct navigation
  navigate("/dashboard");
};


  const handleLoginError = () => {
    console.log("Google Login Failed");
    alert("Google Login Failed!");
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
    </div></GoogleOAuthProvider>
  );
}

export default Login;