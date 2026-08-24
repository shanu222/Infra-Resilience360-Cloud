package com.resilience360.mobile;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Re-enqueues the earthquake poll after reboot so closed-app alerts survive
 * a device restart (WorkManager usually restores work, this is a belt-and-braces).
 */
public class EarthquakeBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !"android.intent.action.QUICKBOOT_POWERON".equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            return;
        }
        if (!EarthquakeAlertScheduler.isEnabled(context)) {
            return;
        }
        EarthquakeAlertScheduler.enable(context, EarthquakeAlertScheduler.threshold(context));
    }
}
