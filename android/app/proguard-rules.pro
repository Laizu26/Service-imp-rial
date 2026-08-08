# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

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

# --- Capacitor / plugins : le pont JS<->natif s'appuie sur la réflexion, R8 doit garder ces
# classes et méthodes annotées, sinon les appels depuis la WebView (push notifications, etc.)
# cassent silencieusement en release alors qu'ils marchent en debug.
-keep class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin
-keepclassmembers public class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Firebase Cloud Messaging (notifications push)
-keep class com.google.firebase.** { *; }
