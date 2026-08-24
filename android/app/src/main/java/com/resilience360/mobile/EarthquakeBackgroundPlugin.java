package com.resilience360.mobile;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the web layer start the background poll and show the real Android permission prompt. */
@CapacitorPlugin(name = "EarthquakeBackground")
public class EarthquakeBackgroundPlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        double threshold = call.getDouble("threshold", (double) EarthquakeAlertScheduler.DEFAULT_THRESHOLD);
        EarthquakeAlertScheduler.enable(getContext(), threshold);
        EarthquakeNotificationHelper.ensureChannel(getContext());
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

    @PluginMethod
    public void pollNow(PluginCall call) {
        if (!EarthquakeAlertScheduler.isEnabled(getContext())) {
            call.reject("Background earthquake alerts are not enabled");
            return;
        }
        EarthquakeNotificationHelper.ensureChannel(getContext());
        EarthquakeAlertScheduler.enqueueImmediatePoll(getContext());
        call.resolve(status());
    }

    /**
     * Shows the OS POST_NOTIFICATIONS dialog from the Activity (not Capacitor's
     * permission alias helper, which was never surfacing a prompt).
     */
    @PluginMethod
    public void requestNotificationsPermission(PluginCall call) {
        EarthquakeNotificationHelper.ensureChannel(getContext());
        MainActivity activity = MainActivity.from(getActivity());
        if (activity == null) {
            JSObject result = new JSObject();
            result.put("display", notificationsEnabled() ? "granted" : "denied");
            call.resolve(result);
            return;
        }
        activity.promptNotificationPermission(call);
    }

    @PluginMethod
    public void checkNotificationsPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("display", currentDisplay());
        call.resolve(result);
    }

    @PluginMethod
    public void showTestNotification(PluginCall call) {
        if (!notificationsEnabled()) {
            call.reject("Notification permission is not granted");
            return;
        }
        EarthquakeNotificationHelper.postPermissionTest(getContext());
        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    private String currentDisplay() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return notificationsEnabled() ? "granted" : "denied";
        }
        Activity activity = getActivity();
        if (activity != null
                && ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            return "granted";
        }
        if (notificationsEnabled()) {
            return "granted";
        }
        return "prompt";
    }

    private boolean notificationsEnabled() {
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("enabled", EarthquakeAlertScheduler.isEnabled(getContext()));
        result.put("threshold", EarthquakeAlertScheduler.threshold(getContext()));
        result.put("notificationsEnabled", notificationsEnabled());
        result.put("display", currentDisplay());
        return result;
    }
}
