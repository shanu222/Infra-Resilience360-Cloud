# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# WorkManager instantiates workers by class name from persisted work.
# Without these keeps, release minify strips EarthquakeAlertWorker and
# closed-app earthquake notifications silently never fire.
-keep class * extends androidx.work.Worker
-keep class * extends androidx.work.ListenableWorker
-keep class com.resilience360.mobile.EarthquakeAlertWorker { *; }
-keep class com.resilience360.mobile.EarthquakeAlertScheduler { *; }
-keep class com.resilience360.mobile.EarthquakeBackgroundPlugin { *; }
-keep class com.resilience360.mobile.EarthquakeBootReceiver { *; }
-keep class com.resilience360.mobile.EarthquakeFcmPlugin { *; }
-keep class com.resilience360.mobile.PdfExportPlugin { *; }
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
