package com.resilience360.mobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/** Shared tray posting for permission tests, WorkManager alerts, and FCM. */
public final class EarthquakeNotificationHelper {

    private EarthquakeNotificationHelper() {}

    public static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                EarthquakeAlertScheduler.CHANNEL_ID,
                "Earthquake Alerts",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Significant earthquake alerts based on your chosen magnitude threshold");
        channel.enableVibration(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }

    public static void post(Context context, String title, String body, String eventId) {
        ensureChannel(context);
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            return;
        }

        Intent launch = new Intent(context, MainActivity.class);
        launch.setAction(Intent.ACTION_MAIN);
        launch.addCategory(Intent.CATEGORY_LAUNCHER);
        launch.putExtra("targetUrl", "/view/live-earthquake-map");
        if (eventId != null) {
            launch.putExtra("eventId", eventId);
        }
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        int notificationId = stableId(eventId != null ? eventId : title + body);
        PendingIntent contentIntent = PendingIntent.getActivity(context, notificationId, launch, flags);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(context, EarthquakeAlertScheduler.CHANNEL_ID)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle(title != null && !title.isEmpty() ? title : "Earthquake alert")
                        .setContentText(body != null ? body : "")
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(body != null ? body : ""))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setCategory(NotificationCompat.CATEGORY_ALARM)
                        .setDefaults(Notification.DEFAULT_ALL)
                        .setAutoCancel(true)
                        .setContentIntent(contentIntent);

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build());
        } catch (SecurityException ignored) {
            /* POST_NOTIFICATIONS missing */
        }
    }

    public static void postPermissionTest(Context context) {
        post(
                context,
                "Infra Resilience360 Alert Test",
                "Android earthquake notifications are enabled. Live alerts continue while the app is closed.",
                "permission-test");
    }

    private static int stableId(String eventId) {
        int hash = 0;
        for (int i = 0; i < eventId.length(); i += 1) {
            hash = (hash << 5) - hash + eventId.charAt(i);
        }
        int positive = Math.abs(hash) % 2147480000;
        return positive == 0 ? 1 : positive;
    }
}
