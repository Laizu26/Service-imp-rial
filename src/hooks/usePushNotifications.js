import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Enregistre l'appareil pour les notifications push — no-op sur le web (uniquement actif
 * dans l'app Android/iOS empaquetée avec Capacitor). Le token FCM obtenu est transmis au
 * jeu via onRegisterPushToken pour être stocké sur le citoyen (voir onRegisterPushToken
 * dans useGameActions.js), afin qu'une Cloud Function puisse ensuite cibler cet appareil.
 */
export function usePushNotifications(citizenId, onRegisterPushToken) {
  useEffect(() => {
    if (!citizenId || !Capacitor.isNativePlatform()) return;

    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      if (cancelled) return;

      const current = await PushNotifications.checkPermissions();
      let status = current.receive;
      if (status === "prompt" || status === "prompt-with-rationale") {
        const requested = await PushNotifications.requestPermissions();
        status = requested.receive;
      }
      if (status !== "granted") return;

      const regSub = await PushNotifications.addListener("registration", (token) => {
        onRegisterPushToken && onRegisterPushToken(token.value);
      });
      const errSub = await PushNotifications.addListener("registrationError", (err) => {
        console.error("Erreur d'enregistrement aux notifications push :", err);
      });

      await PushNotifications.register();

      cleanup = () => {
        regSub.remove();
        errSub.remove();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [citizenId, onRegisterPushToken]);
}
