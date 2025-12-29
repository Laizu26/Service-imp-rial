import { useState, useEffect, useCallback } from "react";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SYSTEM_CONFIG, DEFAULT_GAME_STATE } from "../lib/constants";

export const useGameEngine = (firebaseUser, notify) => {
  // On démarre directement avec l'état par défaut (qui contient maintenant l'Admin)
  const [state, setState] = useState(DEFAULT_GAME_STATE);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [connection, setConnection] = useState("connecting");
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    if (!firebaseUser || !db) return;
    const docRef = doc(db, ...SYSTEM_CONFIG.dbPath);

    const unsub = onSnapshot(
      docRef,
      (s) => {
        setConnection("connected");
        if (s.exists()) {
          const d = s.data();
          // Fusion : On prend les données distantes, mais si une liste est vide (ex: citizens),
          // on vérifie si on ne devrait pas garder celle par défaut pour éviter le blocage.
          // SAUF si c'est une vraie liste vide voulue. Ici, pour la sécurité, on force le merge.
          setState((prev) => ({
            ...DEFAULT_GAME_STATE, // Base saine
            ...d, // Données distantes prioritaires
            // Sécurité : si la DB renvoie des champs manquants, on garde les []
            countries: d.countries || DEFAULT_GAME_STATE.countries,
            // Astuce : Si la liste DB est vide, on garde le défaut (Admin) pour ne pas se bloquer
            citizens:
              d.citizens && d.citizens.length > 0
                ? d.citizens
                : DEFAULT_GAME_STATE.citizens,
            inventoryCatalog: d.inventoryCatalog || [],
            globalLedger: d.globalLedger || [],
            travelRequests: d.travelRequests || [],
            debtRegistry: d.debtRegistry || [],
            companies: d.companies || [],
          }));
          setDbError(null);
        } else {
          // Document inexistant : On reste sur DEFAULT_GAME_STATE (avec Admin)
          console.log(
            "Document introuvable, utilisation de l'état par défaut."
          );
          setDbError(null);
        }
      },
      (err) => {
        console.error("Erreur connexion Firestore:", err);
        setConnection("offline");
        setSyncStatus("error");
        setDbError(err.message);
        // En cas d'erreur, on garde l'état local (qui contient l'Admin)
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  const saveState = useCallback(
    async (newState) => {
      setState(newState); // Mise à jour optimiste

      if (connection === "connected" && db) {
        setSyncStatus("saving");
        try {
          await setDoc(
            doc(db, ...SYSTEM_CONFIG.dbPath),
            { ...newState, lastUpdate: serverTimestamp() },
            { merge: true }
          );
          setSyncStatus("saved");
          setTimeout(() => setSyncStatus("idle"), 2000);
        } catch (e) {
          console.error("Erreur save:", e);
          setSyncStatus("error");
          setDbError(e.message);
          notify("Erreur d'archivage (vérifiez votre connexion).", "error");
        }
      } else {
        setSyncStatus("error");
        notify(
          "Mode Hors-Ligne : Modifications locales uniquement.",
          "warning"
        );
      }
    },
    [connection, notify]
  );

  const forceInit = async () => {
    if (!db) return;
    // Réinitialise la BDD avec les valeurs par défaut (incluant l'Admin)
    await saveState(DEFAULT_GAME_STATE);
    notify(
      "Reset système effectué : Base de données réinitialisée.",
      "success"
    );
  };

  return { state, saveState, syncStatus, connection, dbError, forceInit };
};
