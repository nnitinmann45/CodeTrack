import React, { createContext, useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import Dashboard from "./Dashboard";
import "./styles.css";
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [mailConfigured, setMailConfigured] = useState(false);
  const [notice, setNotice] = useState(""),
    [connectionError, setConnectionError] = useState("");
  async function loadSession() {
    setLoading(true);
    setConnectionError("");
    try {
      const d = await api("/auth/me");
      setUser(d.user);
      setMailConfigured(d.mailConfigured);
    } catch (e) {
      if (e.status !== 401) setConnectionError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const token = new URLSearchParams(location.search).get("verify");
    if (token) {
      history.replaceState({}, "", "/");
      api("/auth/verify-email", { method: "POST", body: { token } })
        .then((d) => setNotice(d.message))
        .catch((e) => setNotice(e.message))
        .finally(loadSession);
    } else loadSession();
  }, []);
  if (loading)
    return (
      <div className="loading">
        <span className="brand-mark">C</span>
        <p>Opening your workspace…</p>
      </div>
    );
  if (connectionError)
    return (
      <div className="loading">
        <h2>Couldn’t reach CodeTrack</h2>
        <p>{connectionError}</p>
        <button onClick={loadSession}>Try again</button>
      </div>
    );
  return (
    <AuthContext.Provider
      value={{ user, setUser, mailConfigured, refresh: loadSession }}
    >
      {notice && (
        <div className="global-notice" role="status">
          {notice}
          <button className="text-button" onClick={() => setNotice("")}>
            Dismiss
          </button>
        </div>
      )}
      {user ? <Dashboard /> : <AuthScreen />}
    </AuthContext.Provider>
  );
}
function AuthScreen() {
  const { refresh } = useAuth();
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (register)
      data.timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    try {
      await api(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: data,
      });
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <a href="/" className="brand">
          <span className="brand-mark">C</span>CodeTrack
          <span className="brand-dot">.</span>
        </a>
        <div>
          <p className="eyebrow">ONE PROBLEM AT A TIME</p>
          <h1>
            Small steps.
            <br />
            Visible progress.
          </h1>
          <p className="story-copy">
            Your coding journey deserves more than a collection of open tabs.
            Keep your practice, insights, and momentum together.
          </p>
          <div className="story-grid">
            <span>01 / Log your practice</span>
            <span>02 / Find your rhythm</span>
            <span>03 / See yourself grow</span>
          </div>
        </div>
        <p className="story-footer">
          Built for the practice. Not just the streak.
        </p>
      </section>
      <main className="auth-main">
        <div className="auth-card">
          <p className="eyebrow">YOUR PERSONAL CODING WORKSPACE</p>
          <h2>{register ? "Start your journey" : "Welcome back"}</h2>
          <p className="muted">
            {register
              ? "A little progress, every day."
              : "Pick up where you left off."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="Nitin Kumar"
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 8 : 1}
                maxLength={72}
                placeholder={
                  register ? "At least 8 characters" : "Enter your password"
                }
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="wide" disabled={busy}>
              {busy
                ? "Please wait…"
                : register
                  ? "Create account →"
                  : "Log in →"}
            </button>
          </form>
          <p className="switch-auth">
            {register ? "Already have an account?" : "New to CodeTrack?"}{" "}
            <button
              className="text-button"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Log in" : "Create account"}
            </button>
          </p>
          <p className="fine-print">
            Manually track problems from your favorite platforms.
            <br />
            Your records are private to your account.
          </p>
        </div>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
