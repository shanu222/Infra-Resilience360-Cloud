package com.resilience360.mobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Polls the USGS feed and posts earthquake alerts from a background thread.
 *
 * <p>The JavaScript layer can only raise notifications while the WebView is
 * alive, which meant alerts effectively arrived when the user opened the app
 * rather than when the earthquake happened. This worker owns delivery instead so
 * alerts behave like ordinary push notifications.
 */
public class EarthquakeAlertWorker extends Worker {

    private static final String TAG = "EqAlertWorker";

    /** Hourly summary keeps the payload small; the poll runs far more often than an hour. */
    private static final String FEED_URL =
            "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";

    /** Fallback when the hourly feed is empty or unavailable. */
    private static final String FEED_URL_BACKUP =
            "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

    private static final int CONNECT_TIMEOUT_MS = 15000;
    private static final int READ_TIMEOUT_MS = 20000;

    /** Ignore anything older than this so a first run cannot replay a whole day. */
    private static final long MAX_EVENT_AGE_MS = 6L * 60L * 60L * 1000L;

    /** One notification burst should never flood the shade. */
    private static final int MAX_NOTIFICATIONS_PER_RUN = 3;

    /** Bounded so the dedupe record cannot grow without limit. */
    private static final int MAX_REMEMBERED_IDS = 200;

    public EarthquakeAlertWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        SharedPreferences prefs = EarthquakeAlertScheduler.preferences(context);

        if (!prefs.getBoolean(EarthquakeAlertScheduler.KEY_ENABLED, false)) {
            return Result.success();
        }
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            return Result.success();
        }

        double threshold = (double) prefs.getFloat(
                EarthquakeAlertScheduler.KEY_THRESHOLD,
                EarthquakeAlertScheduler.DEFAULT_THRESHOLD);

        String body = fetch(FEED_URL);
        if (body == null) {
            body = fetch(FEED_URL_BACKUP);
        }
        if (body == null) {
            // Transient network problem: let WorkManager back off and retry.
            return Result.retry();
        }

        List<Quake> due;
        try {
            due = parseNewQuakes(body, threshold, readSeenIds(prefs));
        } catch (Exception error) {
            Log.w(TAG, "Could not parse the earthquake feed", error);
            return Result.success();
        }

        if (due.isEmpty()) {
            return Result.success();
        }

        ensureChannel(context);

        LinkedHashSet<String> seen = readSeenIds(prefs);
        int posted = 0;
        for (Quake quake : due) {
            if (posted >= MAX_NOTIFICATIONS_PER_RUN) {
                // Still record the rest so they are not replayed on the next run.
                seen.add(quake.id);
                continue;
            }
            postNotification(context, quake);
            seen.add(quake.id);
            posted += 1;
        }
        writeSeenIds(prefs, seen);

        return Result.success();
    }

    private static String fetch(String url) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(READ_TIMEOUT_MS);
            connection.setRequestProperty("Accept", "application/json");
            if (connection.getResponseCode() / 100 != 2) {
                return null;
            }
            StringBuilder out = new StringBuilder();
            try (BufferedReader reader =
                         new BufferedReader(new InputStreamReader(connection.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    out.append(line);
                }
            }
            return out.toString();
        } catch (Exception error) {
            Log.w(TAG, "Earthquake feed request failed: " + url, error);
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private static List<Quake> parseNewQuakes(String json, double threshold, LinkedHashSet<String> seen)
            throws Exception {
        List<Quake> result = new ArrayList<>();
        JSONArray features = new JSONObject(json).optJSONArray("features");
        if (features == null) {
            return result;
        }

        long cutoff = System.currentTimeMillis() - MAX_EVENT_AGE_MS;

        for (int i = 0; i < features.length(); i += 1) {
            JSONObject feature = features.optJSONObject(i);
            if (feature == null) {
                continue;
            }
            JSONObject properties = feature.optJSONObject("properties");
            if (properties == null) {
                continue;
            }

            String id = feature.optString("id", "");
            if (id.isEmpty() || seen.contains(id)) {
                continue;
            }

            double magnitude = properties.optDouble("mag", Double.NaN);
            if (Double.isNaN(magnitude) || magnitude < threshold) {
                continue;
            }

            long time = properties.optLong("time", 0L);
            if (time > 0L && time < cutoff) {
                continue;
            }

            // Product scope: significant quakes near Pakistan (bbox + place text).
            if (!isNearPakistan(feature, placeOf(properties))) {
                continue;
            }

            String place = placeOf(properties);
            result.add(new Quake(id, magnitude, place));
        }
        return result;
    }

    private static String placeOf(JSONObject properties) {
        String place = properties.optString("place", "");
        if (place.isEmpty() || "null".equals(place)) {
            return "Location pending review";
        }
        return place;
    }

    /**
     * Pakistan + immediate neighbourhood (Afghanistan border, Kashmir, western India).
     * Geometry coordinates in GeoJSON are [lon, lat, depth].
     */
    private static boolean isNearPakistan(JSONObject feature, String place) {
        String lower = place == null ? "" : place.toLowerCase(java.util.Locale.US);
        if (lower.contains("pakistan")
                || lower.contains("islamabad")
                || lower.contains("karachi")
                || lower.contains("lahore")
                || lower.contains("peshawar")
                || lower.contains("quetta")
                || lower.contains("kashmir")
                || lower.contains("gilgit")
                || lower.contains("balochistan")
                || lower.contains("hindu kush")
                || lower.contains("hindu-kush")) {
            return true;
        }

        JSONObject geometry = feature.optJSONObject("geometry");
        if (geometry == null) {
            return false;
        }
        JSONArray coords = geometry.optJSONArray("coordinates");
        if (coords == null || coords.length() < 2) {
            return false;
        }
        double lon = coords.optDouble(0, Double.NaN);
        double lat = coords.optDouble(1, Double.NaN);
        if (Double.isNaN(lon) || Double.isNaN(lat)) {
            return false;
        }
        // Inclusive buffer around Pakistan mainland.
        return lat >= 23.0 && lat <= 38.5 && lon >= 60.0 && lon <= 80.0;
    }

    private static void postNotification(Context context, Quake quake) {
        Intent launch = new Intent(context, MainActivity.class);
        launch.setAction(Intent.ACTION_MAIN);
        launch.addCategory(Intent.CATEGORY_LAUNCHER);
        launch.putExtra("targetUrl", "/view/live-earthquake-map");
        launch.putExtra("eventId", quake.id);
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        int notificationId = stableId(quake.id);
        PendingIntent contentIntent =
                PendingIntent.getActivity(context, notificationId, launch, flags);

        String title = String.format(java.util.Locale.US, "Earthquake M%.1f", quake.magnitude);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(context, EarthquakeAlertScheduler.CHANNEL_ID)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle(title)
                        .setContentText(quake.place)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(quake.place))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setCategory(NotificationCompat.CATEGORY_ALARM)
                        .setDefaults(Notification.DEFAULT_ALL)
                        .setAutoCancel(true)
                        .setContentIntent(contentIntent);

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build());
        } catch (SecurityException error) {
            // POST_NOTIFICATIONS was revoked between the check above and here.
            Log.w(TAG, "Notification permission missing", error);
        }
    }

    private static void ensureChannel(Context context) {
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

    /** Same event must map to the same notification id so a repeat replaces rather than stacks. */
    private static int stableId(String eventId) {
        int hash = 0;
        for (int i = 0; i < eventId.length(); i += 1) {
            hash = (hash << 5) - hash + eventId.charAt(i);
        }
        int positive = Math.abs(hash) % 2147480000;
        return positive == 0 ? 1 : positive;
    }

    private static LinkedHashSet<String> readSeenIds(SharedPreferences prefs) {
        LinkedHashSet<String> ids = new LinkedHashSet<>();
        String raw = prefs.getString(EarthquakeAlertScheduler.KEY_SEEN_IDS, "");
        if (raw == null || raw.isEmpty()) {
            return ids;
        }
        for (String part : raw.split("\n")) {
            if (!part.isEmpty()) {
                ids.add(part);
            }
        }
        return ids;
    }

    private static void writeSeenIds(SharedPreferences prefs, LinkedHashSet<String> ids) {
        List<String> ordered = new ArrayList<>(ids);
        int from = Math.max(0, ordered.size() - MAX_REMEMBERED_IDS);
        StringBuilder out = new StringBuilder();
        for (int i = from; i < ordered.size(); i += 1) {
            if (out.length() > 0) {
                out.append('\n');
            }
            out.append(ordered.get(i));
        }
        prefs.edit().putString(EarthquakeAlertScheduler.KEY_SEEN_IDS, out.toString()).apply();
    }

    private static final class Quake {
        final String id;
        final double magnitude;
        final String place;

        Quake(String id, double magnitude, String place) {
            this.id = id;
            this.magnitude = magnitude;
            this.place = place;
        }
    }
}
