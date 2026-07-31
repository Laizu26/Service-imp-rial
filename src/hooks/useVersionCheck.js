import { useState, useEffect, useCallback, useRef } from "react";

const CHECK_INTERVAL_MS = 90000; // 90s

// Détecte qu'une nouvelle version du site a été déployée en comparant la
// version embarquée dans ce bundle JS (figée au build) à public/version.json
// (régénéré à chaque déploiement). Inactif en développement (pas de build de prod).
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const buildVersion = process.env.REACT_APP_BUILD_VERSION;
  const alreadyDetected = useRef(false);

  const checkVersion = useCallback(async () => {
    if (!buildVersion || alreadyDetected.current) return;
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.version && data.version !== buildVersion) {
        alreadyDetected.current = true;
        setUpdateAvailable(true);
      }
    } catch {
      // Coupure réseau ponctuelle — nouvelle tentative au prochain intervalle.
    }
  }, [buildVersion]);

  useEffect(() => {
    if (!buildVersion) return undefined;
    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") checkVersion(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [buildVersion, checkVersion]);

  return updateAvailable;
}
