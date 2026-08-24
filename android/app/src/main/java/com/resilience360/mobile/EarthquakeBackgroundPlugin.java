package com.resilience360.mobile;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the web layer start and stop the background earthquake poll. */
@CapacitorPlugin(name = "EarthquakeBackground")
public class EarthquakeBackgroundPlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        double threshold = call.getDouble("threshold", (double) EarthquakeAlertScheduler.DEFAULT_THRESHOLD);
        EarthquakeAlertScheduler.enable(getContext(), threshold);
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

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("enabled", EarthquakeAlertScheduler.isEnabled(getContext()));
        result.put("threshold", EarthquakeAlertScheduler.threshold(getContext()));
        return result;
    }
}
