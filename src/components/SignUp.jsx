import React, { useState } from "react";
import { signUp } from "../services/dataService.js";
import PasswordField from "./PasswordField.jsx";

export default function SignUp({ onSuccess, switchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const user = await signUp({ email, password });
      onSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="auth-eyebrow">Get started</p>
      <h1 className="auth-title">Create your account</h1>
      <p className="card-subtitle" style={{ marginBottom: 20 }}>
        The first person to sign up becomes the admin. Everyone after
        that starts as a worker.
      </p>
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
          autoComplete="new-password"
          required
        />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account?{" "}
        <button className="link-btn" onClick={switchToLogin}>
          Log in
        </button>
      </p>
    </div>
  );
}
