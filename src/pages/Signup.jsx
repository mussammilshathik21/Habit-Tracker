import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function Signup() {
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    if (form.password.length < 6) return setError("Password should be at least 6 characters.");
    setLoading(true);
    const res = await signup(form);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    if (res.needsEmailConfirm) {
      setCheckEmail(true);
      return;
    }
    navigate("/profile", { replace: true });
  };

  if (checkEmail) {
    return (
      <div className="auth-screen">
        <div className="card auth-card stack" style={{ gap: 16 }}>
          <div className="sidebar-brand" style={{ justifyContent: "center" }}>
            <div className="sidebar-brand-icon"><Sparkles size={16} /></div>
            <span className="sidebar-brand-name">Habit Tracker</span>
          </div>
          <div className="center-text">
            <h1 className="title-lg">Check your email</h1>
            <p className="text-sm text-sub mt-1">
              We sent a confirmation link to <strong>{form.email}</strong>. Click it, then come back and log in.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: "none", textAlign: "center" }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="card auth-card stack" style={{ gap: 16 }}>
        <div className="sidebar-brand" style={{ justifyContent: "center" }}>
          <div className="sidebar-brand-icon"><Sparkles size={16} /></div>
          <span className="sidebar-brand-name">Habitus</span>
        </div>
        <div className="center-text">
          <h1 className="title-lg">Create your account</h1>
          <p className="text-sm text-sub mt-1">Track habits, streaks, and progress in one place.</p>
        </div>

        <form className="stack" style={{ gap: 12 }} onSubmit={onSubmit}>
          <div className="form-field">
            <input
              className="text-input w-full"
              placeholder="Full name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
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
          <div className="form-row" style={{ marginBottom: 12 }}>
            <input
              className="text-input w-full"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            <input
              className="text-input w-full"
              type="password"
              placeholder="Confirm password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              required
            />
          </div>
          {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? "Creating account…" : "Sign up"}</button>
        </form>

        <p className="text-sm text-sub2 center-text">
          Already have an account? <Link to="/login" style={{ color: "var(--text)", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
