package com.resilience360.mobile;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EarthquakeBackgroundPlugin.class);
        registerPlugin(EarthquakeFcmPlugin.class);
        registerPlugin(PdfExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
