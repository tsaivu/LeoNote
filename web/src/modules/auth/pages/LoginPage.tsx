import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { loginCredentialStorage } from "../services/loginCredentialStorage";
import type { LoginCredentialSaveMode } from "../services/loginCredentialStorage";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const [storedCredentials] = useState(() => loginCredentialStorage.load());
  const [username, setUsername] = useState(storedCredentials.username);
  const [password, setPassword] = useState(storedCredentials.password);
  const [saveMode, setSaveMode] = useState<LoginCredentialSaveMode>(storedCredentials.saveMode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await authService.login(username, password);
      loginCredentialStorage.save(username, password, saveMode);
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
            <div className="brand login-lion-brand">
              <img className="brand-mark brand-lion-mark" src="/lion.png" alt="" aria-hidden="true" />
              <span>Leo Task Management</span>
            </div>
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
              autoComplete="username"
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              autoComplete="current-password"
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <fieldset className="credential-save-options">
            <legend>Save login</legend>
            <label>
              <input
                checked={saveMode === "none"}
                name="credential-save-mode"
                type="radio"
                value="none"
                onChange={() => setSaveMode("none")}
              />
              Do not save
            </label>
            <label>
              <input
                checked={saveMode === "session"}
                name="credential-save-mode"
                type="radio"
                value="session"
                onChange={() => setSaveMode("session")}
              />
              Until browser closes
            </label>
            <label>
              <input
                checked={saveMode === "permanent"}
                name="credential-save-mode"
                type="radio"
                value="permanent"
                onChange={() => setSaveMode("permanent")}
              />
              Always
            </label>
          </fieldset>
          {saveMode === "permanent" ? (
            <p className="status-text warning">Password will be saved on this device until you change this option.</p>
          ) : null}
          {error ? <p className="status-text danger">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
