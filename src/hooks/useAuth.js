import { useState, useEffect } from "react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export const useAuth = (notify) => {
  const [user, setUser] = useState(null); // Firebase User
  const [session, setSession] = useState(null); // Active Game Session (Current Character)
  const [loading, setLoading] = useState(true);

  // NOUVEAU : Liste des comptes connectés en simultané
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
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

  // Fonction de connexion (Mise à jour pour gérer le multi-compte)
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
      // On l'ajoute à la liste des comptes connectés s'il n'y est pas déjà
      setConnectedAccounts((prev) => {
        const exists = prev.find((u) => u.id === found.id);
        return exists ? prev : [...prev, found];
      });
      return true;
    } else {
      notify("Identifiants invalides.", "error");
      return false;
    }
  };

  // NOUVEAU : Changer de personnage actif
  const switchAccount = (userId) => {
    const target = connectedAccounts.find((u) => u.id === userId);
    if (target) {
      setSession(target);
      notify(`Basculé sur : ${target.name}`, "success");
    }
  };

  // NOUVEAU : Ajouter un compte (revient à l'écran de login sans perdre les sessions)
  const addAccount = () => {
    setSession(null); // Cela affichera le LoginScreen via App.js
  };

  // NOUVEAU : Déconnexion complète ou d'un seul compte
  const logoutAccount = (userId = null) => {
    if (!userId) {
      // Déconnexion totale
      setSession(null);
      setConnectedAccounts([]);
    } else {
      // Retirer un seul compte
      const newAccounts = connectedAccounts.filter((u) => u.id !== userId);
      setConnectedAccounts(newAccounts);
      if (session && session.id === userId) {
        // Si on déconnecte le compte actuel, on switch ou on sort
        setSession(newAccounts.length > 0 ? newAccounts[0] : null);
      }
    }
  };

  return {
    firebaseUser: user,
    session,
    setSession,
    authLoading: loading,
    loginGame,
    // --- NOUVEAUX EXPORTS ---
    connectedAccounts,
    switchAccount,
    addAccount,
    logoutAccount,
  };
};
