import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider }   from "./context/CartContext";
import { ToastProvider }  from "./context/ToastContext";
import { AuthProvider }   from "./context/AuthContext";
import ProtectedRoute     from "./components/ProtectedRoute";

import LandingPage  from "./pages/LandingPage";
import MenuPage     from "./pages/MenuPage";
import KitchenPage  from "./pages/KitchenPage";
import WebsitePage  from "./pages/WebsitePage";
import LoginPage    from "./pages/LoginPage";
import AdminPage    from "./pages/AdminPage";

import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* ── Public: customer-facing ── */}
              <Route path="/"        element={<Navigate to="/scan?table=1" replace />} />
              <Route path="/scan"    element={<LandingPage />} />
              <Route path="/menu"    element={<MenuPage />} />
              <Route path="/website" element={<WebsitePage />} />

              {/* ── Auth ── */}
              <Route path="/login"   element={<LoginPage />} />

              {/* ── Protected: Kitchen-only route ──
                  Requires "kitchen" permission.
                  kitchen role → allowed ✅
                  owner/manager → allowed ✅ (they also have kitchen access)
                  waiter → redirected to /admin ✅
                  unauthenticated → redirected to /login ✅        */}
              <Route path="/kitchen" element={
                <ProtectedRoute page="kitchen">
                  <KitchenPage />
                </ProtectedRoute>
              } />

              {/* ── Protected: Admin dashboard ──
                  Requires "dashboard" permission.
                  kitchen role → NOT allowed, redirected to /kitchen ✅
                  owner/manager → allowed ✅
                  waiter → redirected to /admin (has "orders" tab) ✅
                  unauthenticated → redirected to /login ✅        */}
              <Route path="/admin" element={
                <ProtectedRoute page="dashboard">
                  <AdminPage />
                </ProtectedRoute>
              } />

              {/* Catch-all: send unknown URLs to the public landing */}
              <Route path="*" element={<Navigate to="/scan?table=1" replace />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
