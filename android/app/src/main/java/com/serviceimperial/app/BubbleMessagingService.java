package com.serviceimperial.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

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

    private static final String CHANNEL_ID = "mushtagram_dm";
    private static final String CHANNEL_NAME = "Messages Mushtagram";
    private static final String QUICK_REPLY_BASE_URL = "https://service-imp-rial.vercel.app/quick-reply";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data != null && "mushtagram_dm".equals(data.get("type"))) {
            showBubbleNotification(data);
            return;
        }
        super.onMessageReceived(remoteMessage);
    }

    private void showBubbleNotification(Map<String, String> data) {
        String fromId = data.get("fromId");
        String toId = data.get("toId");
        String fromName = data.get("fromName") != null ? data.get("fromName") : "Mushtagram";
        String content = data.get("content") != null ? data.get("content") : "";
        if (fromId == null) return;

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
        // soit éligible aux bulles sur la plupart des versions/constructeurs.
        ShortcutInfoCompat shortcut = new ShortcutInfoCompat.Builder(this, shortcutId)
            .setLongLived(true)
            .setIntent(new Intent(Intent.ACTION_VIEW).setPackage(getPackageName()))
            .setShortLabel(fromName)
            .setIcon(appIcon)
            .setPerson(sender)
            .setCategories(Collections.singleton("android.shortcut.conversation"))
            .build();
        ShortcutManagerCompat.pushDynamicShortcut(this, shortcut);

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
            .setSmallIcon(R.mipmap.ic_launcher)
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
