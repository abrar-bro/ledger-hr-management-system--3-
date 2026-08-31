import { useState } from "react";
import { login } from "../api/auth";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(name, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="brand-mark">⏱</span>
          <div>
            Ledger HR
            <span>Sign in to continue</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="login-name">Name</label>
          <input
            id="login-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Employee Name"
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button
          className="btn btn-amber"
          type="submit"
          disabled={loading}
          style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="login-hint">
          <strong>credentials</strong>
          <div>
            HR admin — name <code>admin</code>, password <code>admin123</code>
          </div>
          <div>
            Any employee — their full name, password <code>employee123</code>
          </div>
        </div>
      </form>
    </div>
  );
}
