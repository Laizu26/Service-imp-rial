import { useState, useEffect } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../lib/firebase";

const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const useAuth = (notify) => {
  const [user, setUser] = useState(null);

  // CHARGEMENT DEPUIS LA MÉMOIRE DU NAVIGATEUR
  const [connectedAccounts, setConnectedAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem("service_imperial_accounts");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erreur lecture localStorage:", e);
      return [];
    }
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // SAUVEGARDE AUTOMATIQUE
  useEffect(() => {
    try {
      localStorage.setItem(
        "service_imperial_accounts",
        JSON.stringify(connectedAccounts)
      );
    } catch (e) {
      console.error("Erreur écriture localStorage:", e);
    }
  }, [connectedAccounts]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error(e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginGame = async (credentials, usersList) => {
    const safeUsers = Array.isArray(usersList) ? usersList : [];
    const inputHash = await sha256(credentials.p);
    const found = safeUsers.find(
      (x) =>
        (x.id === credentials.u.trim() ||
          x.name?.toLowerCase() === credentials.u.trim().toLowerCase()) &&
        // Accepte hash SHA-256 (nouveau) ou plaintext (migration anciens comptes)
        (x.password === inputHash || x.password === credentials.p)
    );

    if (found) {
      // Ne jamais stocker le mot de passe en clair dans localStorage
      const { password: _stripped, ...safeUser } = found;
      setSession(safeUser);
      setConnectedAccounts((prev) => {
        const exists = prev.find((u) => u.id === safeUser.id);
        if (exists) return prev.map((u) => (u.id === safeUser.id ? safeUser : u));
        return [...prev, safeUser];
      });
      return true;
    } else {
      notify("Identifiants invalides.", "error");
      return false;
    }
  };

  const switchAccount = (userId) => {
    const target = connectedAccounts.find((u) => u.id === userId);
    if (target) {
      setSession(target);
      notify(`Basculé sur : ${target.name}`, "success");
    }
  };

  const addAccount = () => {
    setSession(null); // Retour au login
  };

  const logoutAccount = (userId = null) => {
    if (!userId) {
      setSession(null);
      setConnectedAccounts([]);
      localStorage.removeItem("service_imperial_accounts");
      notify("Déconnexion complète.", "info");
    } else {
      const newAccounts = connectedAccounts.filter((u) => u.id !== userId);
      setConnectedAccounts(newAccounts);
      if (session && session.id === userId) {
        setSession(newAccounts.length > 0 ? newAccounts[0] : null);
      }
      notify("Compte retiré.", "info");
    }
  };

  return {
    firebaseUser: user,
    session,
    setSession,
    authLoading: loading,
    loginGame,
    connectedAccounts,
    switchAccount,
    addAccount,
    logoutAccount,
  };
};
