package com.resilience360.mobile;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Lets the web layer start and stop the background earthquake poll. */
@CapacitorPlugin(
        name = "EarthquakeBackground",
        permissions = {
                @Permission(
                        alias = "notifications",
                        strings = { Manifest.permission.POST_NOTIFICATIONS }
                )
        }
)
public class EarthquakeBackgroundPlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        double threshold = call.getDouble("threshold", (double) EarthquakeAlertScheduler.DEFAULT_THRESHOLD);
        EarthquakeAlertScheduler.enable(getContext(), threshold);
        ensureChannel();
        call.resolve(status());
    }

    @PluginMethod
    public void disable(PluginCall call) {
        EarthquakeAlertScheduler.disable(getContext());
        call.resolve(status());
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status());
    }

    /** Force a live-feed check immediately (app open or closed). */
    @PluginMethod
    public void pollNow(PluginCall call) {
        if (!EarthquakeAlertScheduler.isEnabled(getContext())) {
            call.reject("Background earthquake alerts are not enabled");
            return;
        }
        ensureChannel();
        EarthquakeAlertScheduler.enqueueImmediatePoll(getContext());
        call.resolve(status());
    }

    /**
     * Requests POST_NOTIFICATIONS on Android 13+ via the native activity prompt.
     * Prefer this over LocalNotifications.requestPermissions when the JS plugin
     * import timing drops the user-gesture chain.
     */
    @PluginMethod
    public void requestNotificationsPermission(PluginCall call) {
        ensureChannel();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("display", notificationsEnabled() ? "granted" : "denied");
            call.resolve(result);
            return;
        }
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            JSObject result = new JSObject();
            result.put("display", "granted");
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsPermsCallback");
    }

    @PermissionCallback
    private void notificationsPermsCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("display", notificationsEnabled() ? "granted" : "denied");
        call.resolve(result);
    }

    @PluginMethod
    public void checkNotificationsPermission(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            result.put("display", notificationsEnabled() ? "granted" : "denied");
        } else if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            result.put("display", "granted");
        } else {
            result.put("display", "prompt");
        }
        call.resolve(result);
    }

    private boolean notificationsEnabled() {
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager manager = getContext().getSystemService(NotificationManager.class);
        if (manager == null) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                EarthquakeAlertScheduler.CHANNEL_ID,
                "Earthquake Alerts",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Significant earthquake alerts based on your chosen magnitude threshold");
        channel.enableVibration(true);
        manager.createNotificationChannel(channel);
    }

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("enabled", EarthquakeAlertScheduler.isEnabled(getContext()));
        result.put("threshold", EarthquakeAlertScheduler.threshold(getContext()));
        result.put("notificationsEnabled", notificationsEnabled());
        return result;
    }
}
