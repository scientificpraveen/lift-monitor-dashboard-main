import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { login, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await login(username, password);
      setMessage("Login successful!");
      setUsername("");
      setPassword("");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Atlanwa BMS Dashboard</h1>
        <p className="auth-subtitle">Login to your account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && !error && (
            <div className="success-message">{message}</div>
          )}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Processing..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
