import { useState, useEffect, useCallback } from "react";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SYSTEM_CONFIG, DEFAULT_GAME_STATE } from "../lib/constants";

export const useGameEngine = (firebaseUser, notify) => {
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
          setState((prev) => ({
            ...DEFAULT_GAME_STATE,
            ...d,
            countries: d.countries || [],
            citizens: d.citizens || [],
            inventoryCatalog: d.inventoryCatalog || [],
            globalLedger: d.globalLedger || [],
            travelRequests: d.travelRequests || [],
            debtRegistry: d.debtRegistry || [],
          }));
          setDbError(null); // Correction: Placé À L'INTÉRIEUR du if
        } else {
          setDbError(null);
        }
      },
      (err) => {
        setConnection("offline");
        setSyncStatus("error");
        setDbError(err.message);
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  const saveState = useCallback(
    async (newState) => {
      setState(newState); // Optimistic UI update

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
          setSyncStatus("error");
          setDbError(e.message);
          notify("Erreur d'archivage.", "error");
        }
      } else {
        setSyncStatus("error");
        notify("Mode Hors-Ligne.", "error");
      }
    },
    [connection, notify]
  );

  const forceInit = async () => {
    if (!db) return;
    await saveState(DEFAULT_GAME_STATE);
    notify("Reset système effectué.", "success");
  };

  return { state, saveState, syncStatus, connection, dbError, forceInit };
};
