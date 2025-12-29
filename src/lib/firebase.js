import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { SYSTEM_CONFIG } from "./constants";

let app, auth, db;

try {
  // Singleton pattern pour éviter les initialisations multiples
  app = !getApps().length ? initializeApp(SYSTEM_CONFIG.firebase) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("ERREUR CRITIQUE FIREBASE:", e);
}

export { app, auth, db };
