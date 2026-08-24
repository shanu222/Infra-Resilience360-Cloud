package com.resilience360.mobile;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

/**
 * Registers local Capacitor plugins and owns the POST_NOTIFICATIONS prompt.
 *
 * Capacitor's JS permission helpers often never reach the system dialog (plugin
 * not listed, callback swallowed). Requesting from the Activity itself does.
 */
public class MainActivity extends BridgeActivity {

    public static final int REQUEST_POST_NOTIFICATIONS = 7101;

    private PluginCall pendingNotifyCall;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EarthquakeBackgroundPlugin.class);
        registerPlugin(EarthquakeFcmPlugin.class);
        registerPlugin(PdfExportPlugin.class);
        super.onCreate(savedInstanceState);
        EarthquakeNotificationHelper.ensureChannel(this);
    }

    void promptNotificationPermission(PluginCall call) {
        try {
            call.setKeepAlive(true);
        } catch (Throwable ignored) {
            /* older Capacitor */
        }
        pendingNotifyCall = call;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            resolveNotify(NotificationManagerCompat.from(this).areNotificationsEnabled(), false);
            return;
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            resolveNotify(true, false);
            return;
        }

        boolean askedBefore = EarthquakeAlertScheduler.preferences(this)
                .getBoolean("asked_notify_permission", false);
        boolean rationale = ActivityCompat.shouldShowRequestPermissionRationale(
                this, Manifest.permission.POST_NOTIFICATIONS);
        if (askedBefore && !rationale) {
            openNotificationSettings();
            resolveNotify(false, true);
            return;
        }

        EarthquakeAlertScheduler.preferences(this)
                .edit()
                .putBoolean("asked_notify_permission", true)
                .apply();

        runOnUiThread(() ->
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        REQUEST_POST_NOTIFICATIONS));
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == REQUEST_POST_NOTIFICATIONS) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            resolveNotify(granted, false);
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    private void openNotificationSettings() {
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
        intent.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
    }

    private void resolveNotify(boolean granted, boolean openedSettings) {
        PluginCall call = pendingNotifyCall;
        pendingNotifyCall = null;
        if (call == null) {
            return;
        }
        if (granted) {
            EarthquakeNotificationHelper.ensureChannel(this);
            EarthquakeNotificationHelper.postPermissionTest(this);
        }
        JSObject result = new JSObject();
        result.put("display", granted ? "granted" : "denied");
        result.put("openedSettings", openedSettings);
        call.resolve(result);
    }

    static MainActivity from(Activity activity) {
        return activity instanceof MainActivity ? (MainActivity) activity : null;
    }
}
