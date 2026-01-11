import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

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


  return (
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
       
      </form>
    </div>
  );
}

export default Login;
