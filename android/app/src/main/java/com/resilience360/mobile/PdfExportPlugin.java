package com.resilience360.mobile;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
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
        // Strip any path segments from the iframe-provided name.
        filename = filename.replace('\\', '/');
        int slash = filename.lastIndexOf('/');
        if (slash >= 0) {
            filename = filename.substring(slash + 1);
        }

        byte[] bytes;
        try {
            bytes = Base64.decode(base64, Base64.DEFAULT);
        } catch (IllegalArgumentException error) {
            call.reject("Invalid PDF data");
            return;
        }
        if (bytes.length == 0) {
            call.reject("Empty PDF data");
            return;
        }

        try {
            Uri contentUri = writePdf(filename, bytes);
            if (contentUri == null) {
                call.reject("Could not save PDF");
                return;
            }
            openShare(contentUri, filename);
            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("uri", contentUri.toString());
            call.resolve(result);
        } catch (Exception error) {
            Log.w(TAG, "PDF export failed", error);
            call.reject(error.getMessage() != null ? error.getMessage() : "PDF export failed");
        }
    }

    private Uri writePdf(String filename, byte[] bytes) throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) {
                return writeToCache(filename, bytes);
            }
            try (OutputStream out = resolver.openOutputStream(uri)) {
                if (out == null) {
                    return writeToCache(filename, bytes);
                }
                out.write(bytes);
                out.flush();
            }
            return uri;
        }
        return writeToCache(filename, bytes);
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
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        Intent chooser = Intent.createChooser(intent, "Save retrofit report");
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(chooser);
    }
}
