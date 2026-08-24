package com.resilience360.mobile;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Saves a base64 PDF to Downloads (or app cache) and opens the system share sheet.
 * WebView {@code <a download>} / {@code pdf.save()} are unreliable on Android Capacitor.
 */
@CapacitorPlugin(name = "PdfExport")
public class PdfExportPlugin extends Plugin {

    private static final String TAG = "PdfExport";

    @PluginMethod
    public void savePdf(PluginCall call) {
        String filename = call.getString("filename", "report.pdf");
        String base64 = call.getString("base64");
        if (base64 == null || base64.isEmpty()) {
            call.reject("Missing PDF data");
            return;
        }
        if (filename == null || filename.trim().isEmpty()) {
            filename = "report.pdf";
        }
        if (!filename.toLowerCase().endsWith(".pdf")) {
            filename = filename + ".pdf";
        }
        filename = filename.replace('\\', '/');
        int slash = filename.lastIndexOf('/');
        if (slash >= 0) {
            filename = filename.substring(slash + 1);
        }

        // Strip data-URI prefix if the web layer sent a full data URL.
        int comma = base64.indexOf(',');
        if (base64.startsWith("data:") && comma > 0) {
            base64 = base64.substring(comma + 1);
        }

        final String finalName = filename;
        final String payload = base64;

        // Decode + write off the Capacitor bridge thread so large reports do not stall JS.
        new Thread(() -> {
            try {
                byte[] bytes = Base64.decode(payload, Base64.DEFAULT);
                if (bytes.length == 0) {
                    call.reject("Empty PDF data");
                    return;
                }
                Uri contentUri = writePdf(finalName, bytes);
                if (contentUri == null) {
                    call.reject("Could not save PDF");
                    return;
                }
                new Handler(Looper.getMainLooper()).post(() -> {
                    try {
                        openShare(contentUri, finalName);
                        JSObject result = new JSObject();
                        result.put("ok", true);
                        result.put("uri", contentUri.toString());
                        call.resolve(result);
                    } catch (Exception error) {
                        Log.w(TAG, "PDF share failed", error);
                        // File is already saved — still treat as success for the web caller.
                        JSObject result = new JSObject();
                        result.put("ok", true);
                        result.put("uri", contentUri.toString());
                        result.put("shared", false);
                        call.resolve(result);
                    }
                });
            } catch (IllegalArgumentException error) {
                call.reject("Invalid PDF data");
            } catch (Exception error) {
                Log.w(TAG, "PDF export failed", error);
                call.reject(error.getMessage() != null ? error.getMessage() : "PDF export failed");
            }
        }, "r360-pdf-export").start();
    }

    private Uri writePdf(String filename, byte[] bytes) throws Exception {
        // Prefer cache + FileProvider — MediaStore can hang or deny on some OEMs.
        Uri cached = writeToCache(filename, bytes);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    try (OutputStream out = resolver.openOutputStream(uri)) {
                        if (out != null) {
                            out.write(bytes);
                            out.flush();
                            return uri;
                        }
                    }
                }
            } catch (Exception error) {
                Log.w(TAG, "MediaStore PDF save failed; using cache", error);
            }
        }
        return cached;
    }

    private Uri writeToCache(String filename, byte[] bytes) throws Exception {
        File dir = new File(getContext().getCacheDir(), "pdf-exports");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IllegalStateException("Could not create export folder");
        }
        File file = new File(dir, filename);
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(bytes);
            out.flush();
        }
        return FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                file);
    }

    private void openShare(Uri uri, String filename) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_STREAM, uri);
        intent.putExtra(Intent.EXTRA_SUBJECT, filename);
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        Intent chooser = Intent.createChooser(intent, "Save retrofit report");
        if (getActivity() != null) {
            getActivity().startActivity(chooser);
        } else {
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
        }
    }
}
