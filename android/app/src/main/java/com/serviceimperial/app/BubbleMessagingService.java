package com.serviceimperial.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Collections;
import java.util.Map;

/**
 * Étend le service FCM par défaut de Capacitor pour intercepter les messages privés Mushtagram
 * (envoyés en "data message" pur par la Cloud Function notifyPush, voir functions/index.js) et
 * afficher une notification "bulle" (Android 11+, façon Google Messages) plutôt que la
 * notification système classique. Tout autre type de message continue de suivre le
 * comportement Capacitor standard via super.onMessageReceived().
 */
public class BubbleMessagingService extends MessagingService {

    private static final String TAG = "BubbleMessagingService";
    private static final String CHANNEL_ID = "mushtagram_dm";
    private static final String CHANNEL_NAME = "Messages Mushtagram";
    private static final String QUICK_REPLY_BASE_URL = "https://service-imp-rial.vercel.app/quick-reply";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        // Log.i (jamais retiré par R8/ProGuard, contrairement à Log.d dans certaines confs) —
        // trace systématique de TOUT message reçu par ce service, pour vérifier qu'il est
        // bien celui invoqué par le système (et pas l'ancien service Capacitor).
        Map<String, String> data = remoteMessage.getData();
        Log.i(TAG, "onMessageReceived — data=" + data);
        if (data != null && "mushtagram_dm".equals(data.get("type"))) {
            // Ne doit jamais faire planter l'app — au pire, le message ne s'affiche pas en
            // notification "bulle" (repli silencieux), plutôt qu'un crash du processus.
            try {
                showBubbleNotification(data);
            } catch (Throwable e) {
                Log.e(TAG, "Échec construction notification bulle", e);
            }
            return;
        }
        super.onMessageReceived(remoteMessage);
    }

    private void showBubbleNotification(Map<String, String> data) {
        String fromId = data.get("fromId");
        String toId = data.get("toId");
        String fromName = data.get("fromName") != null ? data.get("fromName") : "Mushtagram";
        String content = data.get("content") != null ? data.get("content") : "";
        if (fromId == null) {
            Log.w(TAG, "mushtagram_dm reçu sans fromId, abandon");
            return;
        }

        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            Log.w(TAG, "Notifications désactivées pour l'app (permission refusée ou coupée) — rien à afficher");
            return;
        }

        ensureChannel();

        String shortcutId = "dm_" + fromId;

        Person me = new Person.Builder().setName("Vous").build();
        Person sender = new Person.Builder()
            .setName(fromName)
            .setKey(fromId)
            .setImportant(true)
            .build();

        IconCompat appIcon = IconCompat.createWithResource(this, R.mipmap.ic_launcher);

        // Raccourci dynamique "conversation" — requis par Android pour qu'une notification
        // soit éligible aux bulles sur la plupart des versions/constructeurs. Isolé dans son
        // propre try/catch : un rejet (limite de fréquence, contraintes OEM) ne doit pas
        // empêcher l'affichage de la notification elle-même, juste dégrader vers une
        // notification classique sans bulle.
        try {
            ShortcutInfoCompat shortcut = new ShortcutInfoCompat.Builder(this, shortcutId)
                .setLongLived(true)
                .setIntent(new Intent(Intent.ACTION_VIEW).setPackage(getPackageName()))
                .setShortLabel(fromName)
                .setIcon(appIcon)
                .setPerson(sender)
                .setCategories(Collections.singleton("android.shortcut.conversation"))
                .build();
            ShortcutManagerCompat.pushDynamicShortcut(this, shortcut);
        } catch (Throwable e) {
            Log.e(TAG, "Échec création du raccourci dynamique (non bloquant)", e);
        }

        String bubbleUrl = QUICK_REPLY_BASE_URL
            + "?dm=" + Uri.encode(fromId)
            + "&name=" + Uri.encode(fromName)
            + (toId != null ? "&asId=" + Uri.encode(toId) : "");
        Intent bubbleIntent = new Intent(this, BubbleActivity.class);
        bubbleIntent.putExtra("url", bubbleUrl);
        PendingIntent bubblePendingIntent = PendingIntent.getActivity(
            this,
            fromId.hashCode(),
            bubbleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.BubbleMetadata bubbleMetadata = new NotificationCompat.BubbleMetadata.Builder(bubblePendingIntent, appIcon)
            .setDesiredHeight(600)
            .setAutoExpandBubble(false)
            .setSuppressNotification(false)
            .build();

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            // L'icône de la barre de statut doit être une image simple (masque alpha), jamais
            // une icône adaptative (ic_launcher moderne, faite de calques premier-plan/fond) —
            // l'utiliser ici est une cause fréquente de plantage. android.R.drawable.sym_def_app_icon
            // est une ressource système garantie non-adaptative, présente sur toutes les versions.
            .setSmallIcon(android.R.drawable.sym_def_app_icon)
            .setContentTitle(fromName)
            .setContentText(content)
            .setStyle(new NotificationCompat.MessagingStyle(me).addMessage(content, System.currentTimeMillis(), sender))
            .setShortcutId(shortcutId)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setBubbleMetadata(bubbleMetadata)
            .setContentIntent(bubblePendingIntent);

        NotificationManagerCompat.from(this).notify(shortcutId, 1, builder.build());
        Log.i(TAG, "Notification bulle affichée pour " + fromName + " (shortcutId=" + shortcutId + ")");
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Messages privés reçus sur Mushtagram");
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }
}
