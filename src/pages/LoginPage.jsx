import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, ROLE_HOME } from "../context/AuthContext";

export default function LoginPage() {
  const { login, user, profile, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass]     = useState(false);

  // If already logged in and profile loaded → redirect to role home
  useEffect(() => {
    if (!loading && user && profile) {
      const from = location.state?.from?.pathname;
      // Only honour "from" if it's a real page, not /login itself
      const dest = (from && from !== "/login") ? from : ROLE_HOME[profile.role] || "/kitchen";
      navigate(dest, { replace: true });
    }
  }, [loading, user, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // Navigation handled by the useEffect above once profile loads
    } catch (err) {
      const MSG = {
        "auth/invalid-credential":     "Incorrect email or password.",
        "auth/user-not-found":         "No account found with this email.",
        "auth/wrong-password":         "Incorrect password.",
        "auth/invalid-email":          "Please enter a valid email address.",
        "auth/too-many-requests":      "Too many failed attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/user-disabled":          "This account has been disabled. Contact your manager.",
      };
      setError(MSG[err.code] || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-inner">
          <div className="spinner" />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bokeh login-bokeh-1" />
        <div className="login-bokeh login-bokeh-2" />
      </div>

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-emblem">🪔</div>
          <h1>Bikaner Branch</h1>
          <p>Staff Portal · Kanhan</p>
        </div>
        <div className="login-divider" />

        <h2 className="login-title">Staff Sign In</h2>
        <p className="login-subtitle">Enter your credentials to continue</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              className="field-input"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="you@bikaner.com"
              autoComplete="email"
              disabled={submitting}
              inputMode="email"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="pass-wrap">
              <input
                id="password"
                className="field-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">{error}</div>
          )}

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting
              ? <><span className="btn-spinner" /> Signing in…</>
              : "Sign In →"}
          </button>
        </form>

        <div className="login-hint">
          <span>🔒</span>
          <span>
            Access is role-based. Kitchen staff see only the kitchen display.
            Contact the restaurant owner to get your login credentials.
          </span>
        </div>

        {/* Role legend */}
        <div className="login-roles">
          <div className="login-role-row"><span className="lr-dot" style={{background:"#D97706"}}/>Owner — full access</div>
          <div className="login-role-row"><span className="lr-dot" style={{background:"#6B5CE7"}}/>Manager — dashboard + orders + kitchen</div>
          <div className="login-role-row"><span className="lr-dot" style={{background:"#22C55E"}}/>Kitchen — kitchen display only</div>
          <div className="login-role-row"><span className="lr-dot" style={{background:"#3B82F6"}}/>Waiter — orders view only</div>
        </div>
      </div>

      <div className="login-footer">© 2026 Bikaner Sweets & Restaurant · Kanhan</div>
    </div>
  );
}
