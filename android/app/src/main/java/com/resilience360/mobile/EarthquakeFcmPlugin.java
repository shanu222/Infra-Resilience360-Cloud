package com.resilience360.mobile;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.messaging.FirebaseMessaging;

/**
 * FCM helpers: device token + topic subscription for closed-app earthquake pushes.
 *
 * Topic {@code earthquake-alerts} lets Firebase Console / your backend fan-out
 * one message to every opted-in device without storing tokens first.
 */
@CapacitorPlugin(name = "EarthquakeFcm")
public class EarthquakeFcmPlugin extends Plugin {

    private static final String TAG = "EarthquakeFcm";
    public static final String TOPIC_ALERTS = "earthquake-alerts";

    @PluginMethod
    public void getToken(PluginCall call) {
        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful() || task.getResult() == null) {
                        Exception error = task.getException();
                        Log.w(TAG, "FCM token failed", error);
                        call.reject(error != null && error.getMessage() != null
                                ? error.getMessage()
                                : "Could not get FCM token");
                        return;
                    }
                    JSObject result = new JSObject();
                    result.put("token", task.getResult());
                    call.resolve(result);
                });
    }

    @PluginMethod
    public void subscribeAlerts(PluginCall call) {
        FirebaseMessaging.getInstance().subscribeToTopic(TOPIC_ALERTS)
                .addOnCompleteListener(task -> {
                    JSObject result = new JSObject();
                    result.put("topic", TOPIC_ALERTS);
                    result.put("ok", task.isSuccessful());
                    if (!task.isSuccessful()) {
                        Exception error = task.getException();
                        Log.w(TAG, "Topic subscribe failed", error);
                        call.reject(error != null && error.getMessage() != null
                                ? error.getMessage()
                                : "Topic subscribe failed");
                        return;
                    }
                    call.resolve(result);
                });
    }

    @PluginMethod
    public void unsubscribeAlerts(PluginCall call) {
        FirebaseMessaging.getInstance().unsubscribeFromTopic(TOPIC_ALERTS)
                .addOnCompleteListener(task -> {
                    JSObject result = new JSObject();
                    result.put("topic", TOPIC_ALERTS);
                    result.put("ok", task.isSuccessful());
                    call.resolve(result);
                });
    }
}
