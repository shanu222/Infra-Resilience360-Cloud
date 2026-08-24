package com.resilience360.mobile;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

/** Enqueues and cancels the background earthquake poll, and stores its settings. */
public final class EarthquakeAlertScheduler {

    public static final String CHANNEL_ID = "earthquake-alerts";

    private static final String PREFS_NAME = "r360_earthquake_alerts";
    private static final String WORK_NAME = "r360-earthquake-alert-poll";

    public static final String KEY_ENABLED = "enabled";
    public static final String KEY_THRESHOLD = "threshold";
    public static final String KEY_SEEN_IDS = "seen_ids";

    public static final float DEFAULT_THRESHOLD = 5f;

    /**
     * 15 minutes is the shortest interval Android allows for periodic work; the
     * OS may stretch it further while the device is dozing.
     */
    private static final long INTERVAL_MINUTES = 15L;

    private EarthquakeAlertScheduler() {}

    public static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static void enable(Context context, double threshold) {
        preferences(context)
                .edit()
                .putBoolean(KEY_ENABLED, true)
                .putFloat(KEY_THRESHOLD, (float) threshold)
                .apply();

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        PeriodicWorkRequest request =
                new PeriodicWorkRequest.Builder(
                        EarthquakeAlertWorker.class, INTERVAL_MINUTES, TimeUnit.MINUTES)
                        .setConstraints(constraints)
                        .build();

        // UPDATE keeps the existing schedule's elapsed time instead of restarting
        // the interval, so re-opening the app cannot starve the poll.
        WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request);
    }

    public static void disable(Context context) {
        preferences(context).edit().putBoolean(KEY_ENABLED, false).apply();
        WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME);
    }

    public static boolean isEnabled(Context context) {
        return preferences(context).getBoolean(KEY_ENABLED, false);
    }

    public static double threshold(Context context) {
        return preferences(context).getFloat(KEY_THRESHOLD, DEFAULT_THRESHOLD);
    }
}
