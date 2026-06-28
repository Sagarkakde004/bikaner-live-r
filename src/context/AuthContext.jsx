import { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db } from "../utils/firebase";

const AuthContext = createContext(null);

// Single source of truth for role permissions — never duplicated anywhere else
export const ROLE_ACCESS = {
  owner:   ["dashboard", "kitchen", "orders", "accounts", "menu", "profile"],
  manager: ["dashboard", "kitchen", "orders", "menu", "profile"],
  kitchen: ["kitchen", "profile"],   // ONLY kitchen + own profile
  waiter:  ["orders", "profile"],
};

// Where each role lands after login
export const ROLE_HOME = {
  owner:   "/admin",
  manager: "/admin",
  kitchen: "/kitchen",
  waiter:  "/admin",
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        const snap = await get(ref(db, `staff/${fbUser.uid}`));
        if (snap.exists()) {
          setProfile(snap.val());
        } else {
          // First ever login — auto-assign owner role
          const profileData = {
            name: fbUser.displayName || fbUser.email.split("@")[0],
            email: fbUser.email,
            role: "owner",
            uid: fbUser.uid,
            createdAt: new Date().toISOString(),
          };
          await set(ref(db, `staff/${fbUser.uid}`), profileData);
          setProfile(profileData);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  // canAccess: checks if current user's role allows a given page key
  const canAccess = (page) => {
    if (!profile) return false;
    return (ROLE_ACCESS[profile.role] || []).includes(page);
  };

  // homeRoute: where to redirect after login based on role
  const homeRoute = () => ROLE_HOME[profile?.role] || "/login";

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, canAccess, homeRoute }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
