import React, { useState } from "react";
import { login } from "../services/dataService.js";
import PasswordField from "./PasswordField.jsx";

export default function Login({ onSuccess, switchToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ email, password });
      onSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="auth-eyebrow">Welcome back</p>
      <h1 className="auth-title">Log in</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="field">
          <span>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="auth-switch">
        New here?{" "}
        <button className="link-btn" onClick={switchToSignUp}>
          Create an account
        </button>
      </p>
    </div>
  );
}
