package com.serviceimperial.app;

import android.util.Log;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

/**
 * Relais de logs vers Firebase Crashlytics (en plus de Logcat local) — pour pouvoir déboguer la
 * notification "bulle" depuis la console Firebase (Crashlytics -> Non-fatals) sans avoir besoin
 * d'Android Studio/adb branché sur l'appareil de test. N'écrit jamais dans le document de jeu
 * (game state) : Crashlytics est un canal totalement indépendant, pas de risque de déclencher
 * les Cloud Functions ni de polluer les données du jeu.
 */
final class RemoteLog {

    private RemoteLog() {}

    static void i(String tag, String message) {
        Log.i(tag, message);
        try {
            FirebaseCrashlytics.getInstance().log(tag + ": " + message);
        } catch (Throwable ignored) {
            // Crashlytics indisponible (pas encore initialisé, etc.) — le log local suffit.
        }
    }

    static void w(String tag, String message) {
        Log.w(tag, message);
        try {
            FirebaseCrashlytics.getInstance().log("[WARN] " + tag + ": " + message);
        } catch (Throwable ignored) {}
    }

    static void e(String tag, String message, Throwable error) {
        Log.e(tag, message, error);
        try {
            FirebaseCrashlytics crashlytics = FirebaseCrashlytics.getInstance();
            crashlytics.log("[ERROR] " + tag + ": " + message);
            crashlytics.recordException(error != null ? error : new RuntimeException(message));
        } catch (Throwable ignored) {}
    }
}
