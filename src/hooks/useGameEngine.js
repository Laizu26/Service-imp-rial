import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// État initial par défaut
const initialState = {
  dayCycle: 1,
  gameDate: { day: 1, month: 1, year: 1200 },
  treasury: 50000,
  citizens: [],
  countries: [],
  inventoryCatalog: [],
  globalLedger: [],
  travelRequests: [],
  maisonRegistry: [],
  debtRegistry: [],
  gazette: [],
  companies: [], // <--- NOUVEAU : Liste des entreprises
};

export const useGameEngine = (user, notify) => {
  const [state, setState] = useState(initialState);
  const [syncStatus, setSyncStatus] = useState("syncing");
  const [connection, setConnection] = useState("disconnected");
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    // Mode déconnecté ou test sans Firebase
    if (!user) {
      const local = localStorage.getItem("service_imperial_state");
      if (local) {
        try {
          setState({ ...initialState, ...JSON.parse(local) });
        } catch (e) {
          console.error("Erreur lecture sauvegarde locale", e);
        }
      }
      setSyncStatus("local");
      setConnection("connected");
      return;
    }

    // Connexion Firebase
    setConnection("connecting");
    const unsub = onSnapshot(
      doc(db, "game", "global_state"),
      (docSnap) => {
        setConnection("connected");
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Fusion intelligente pour ne pas perdre les champs manquants
          setState((prev) => ({
            ...initialState, // Valeurs par défaut pour les nouveaux champs (ex: companies)
            ...prev,
            ...data,
          }));
          setSyncStatus("idle");
        } else {
          // Première init si la DB est vide
          setSyncStatus("no-data");
        }
      },
      (err) => {
        console.error("Erreur DB:", err);
        setDbError(err.message);
        setConnection("error");
      }
    );

    return () => unsub();
  }, [user]);

  const saveState = async (newState) => {
    // Optimistic UI update
    setState(newState);

    // Sauvegarde Locale (Backup)
    localStorage.setItem("service_imperial_state", JSON.stringify(newState));

    if (!user) return; // Pas de save DB si pas connecté

    setSyncStatus("saving");
    try {
      await setDoc(doc(db, "game", "global_state"), newState);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      setSyncStatus("error");
      notify("Erreur de synchronisation avec le serveur.", "error");
    }
  };

  const forceInit = () => {
    if (
      window.confirm(
        "ATTENTION: Cela va écraser toute la base de données. Continuer ?"
      )
    ) {
      saveState(initialState);
      notify("Monde réinitialisé.", "success");
    }
  };

  return { state, saveState, syncStatus, connection, dbError, forceInit };
};
