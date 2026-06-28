import { Navigate, useLocation } from "react-router-dom";
import { useAuth, ROLE_ACCESS, ROLE_HOME } from "../context/AuthContext";

function LoadingScreen({ message = "Loading…" }) {
  return (
    <div className="auth-loading">
      <div className="auth-loading-inner">
        <div className="spinner" />
        <p>{message}</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute
 *
 * Props:
 *   page  — the permission key to check (e.g. "kitchen", "dashboard").
 *            If the user's role doesn't include this key they are redirected
 *            to their own home route, NOT to /admin.
 *
 * Flow:
 *   1. Not logged in               → /login (with return location)
 *   2. Logged in, no profile yet   → loading spinner
 *   3. Role doesn't allow page     → ROLE_HOME[role]  (e.g. kitchen → /kitchen)
 *   4. All checks pass             → render children
 */
export default function ProtectedRoute({ children, page }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) return <LoadingScreen message="Loading profile…" />;

  if (page) {
    const allowed = (ROLE_ACCESS[profile.role] || []).includes(page);
    if (!allowed) {
      // Send them to their correct home — kitchen staff → /kitchen, never /admin
      const home = ROLE_HOME[profile.role] || "/login";
      return <Navigate to={home} replace />;
    }
  }

  return children;
}
