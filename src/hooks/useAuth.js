import { useState, useEffect } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export const useAuth = (notify) => {
  const [user, setUser] = useState(null); // Utilisateur Firebase
  const [session, setSession] = useState(null); // Session "Jeu" (Role, ID, etc)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
      // Vérification s'il y a un token global (cas rare, mais présent dans ton code original)
      if (
        typeof window.__initial_auth_token !== "undefined" &&
        window.__initial_auth_token
      ) {
        try {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } catch (e) {
          console.warn("Token invalide, fallback anonyme:", e);
          try {
            await signInAnonymously(auth);
          } catch (err) {
            console.error(err);
          }
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error(e);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginGame = (credentials, usersList) => {
    const safeUsers = Array.isArray(usersList) ? usersList : [];
    const found = safeUsers.find(
      (x) =>
        (x.id === credentials.u.trim() ||
          x.name?.toLowerCase() === credentials.u.trim().toLowerCase()) &&
        x.password === credentials.p
    );

    if (found) {
      setSession(found);
      return true;
    } else {
      notify("Identifiants invalides.", "error");
      return false;
    }
  };

  return {
    firebaseUser: user,
    session,
    setSession,
    authLoading: loading,
    loginGame,
  };
};
