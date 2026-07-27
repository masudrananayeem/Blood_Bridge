import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase.js";
import { syncLogin, fetchCurrentUser } from "../services/authService.js";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // raw Firebase user
  const [user, setUser] = useState(null); // Mongo profile + role + JWT
  const [loading, setLoading] = useState(true);

  // Keep local state in sync with Firebase's own session persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // We already have a backend JWT saved (e.g. page refresh) — just
          // fetch the profile again to keep role/availability fresh.
          const token = localStorage.getItem("bb-token");
          if (token) {
            const { user: profile } = await fetchCurrentUser();
            setUser(profile);
          }
        } catch {
          // token expired/invalid — force a clean re-login
          localStorage.removeItem("bb-token");
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem("bb-token");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Exchange the fresh Firebase ID token for our backend JWT + profile
  const syncWithBackend = async () => {
    const idToken = await auth.currentUser.getIdToken(true);
    const { token, user: profile } = await syncLogin(idToken);
    localStorage.setItem("bb-token", token);
    setUser(profile);
    return profile;
  };

  const registerWithEmail = async ({ fullName, email, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    await sendEmailVerification(cred.user);
    return cred.user;
  };

  const loginWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    return syncWithBackend();
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    return syncWithBackend();
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("bb-token");
    setUser(null);
  };

  const value = {
    firebaseUser,
    user,
    setUser,
    loading,
    isAuthenticated: !!firebaseUser,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    resetPassword,
    logout,
    syncWithBackend,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
