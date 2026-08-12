import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(form);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    const dest = location.state?.from?.pathname || "/";
    navigate(dest, { replace: true });
  };

  return (
    <div className="auth-screen">
      <div className="card auth-card stack" style={{ gap: 16 }}>
        <div className="sidebar-brand" style={{ justifyContent: "center" }}>
          <div className="sidebar-brand-icon"><Sparkles size={16} /></div>
          <span className="sidebar-brand-name">Habit Tracker</span>
        </div>
        <div className="center-text">
          <h1 className="title-lg">Welcome back</h1>
          <p className="text-sm text-sub mt-1">Log in to keep your streaks going.</p>
        </div>

        <form className="stack" style={{ gap: 12 }} onSubmit={onSubmit}>
          <div className="form-field">
            <input
              className="text-input w-full"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <input
              className="text-input w-full"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
        </form>

        <p className="text-sm text-sub2 center-text">
          No account yet? <Link to="/signup" style={{ color: "var(--text)", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
