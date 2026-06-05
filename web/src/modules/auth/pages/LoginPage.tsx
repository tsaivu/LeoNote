import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await authService.login(username, password);
      setAuthSession(session);
      navigate("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-hero">
          <div>
            <div className="brand">
              <span className="brand-mark brand-lion-mark" aria-hidden="true" />
              <span>Leo Task Management</span>
            </div>
            <h1>Task clarity, without noise.</h1>
            <p>Personal notes, deadlines, subtasks and internal assignees in one controlled workspace.</p>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <h2>Sign in</h2>
            <p className="status-text">Use your username to access local workspace data.</p>
          </div>
          <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
          <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
          {error ? <p className="status-text danger">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        </form>
      </section>
    </main>
  );
}
