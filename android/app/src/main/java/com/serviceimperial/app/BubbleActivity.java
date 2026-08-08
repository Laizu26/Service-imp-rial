package com.serviceimperial.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

/**
 * Activité légère affichée dans une bulle Android (voir BubbleMessagingService) — une simple
 * WebView pointée vers la page de réponse rapide du site, qui réutilise automatiquement la
 * session de connexion déjà stockée (cookies/localStorage partagés entre WebView du même
 * appareil et de la même app).
 */
public class BubbleActivity extends Activity {

    private static final String TAG = "BubbleActivity";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            WebView webView = new WebView(this);
            webView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
            ));
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            webView.setWebViewClient(new WebViewClient());
            setContentView(webView);

            loadFromIntent(webView, getIntent());
        } catch (Throwable e) {
            Log.e(TAG, "Échec ouverture de la bulle", e);
            TextView fallback = new TextView(this);
            fallback.setText("Impossible d'ouvrir la conversation ici — ouvrez l'application.");
            fallback.setPadding(32, 32, 32, 32);
            setContentView(fallback);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    private void loadFromIntent(WebView webView, Intent intent) {
        String url = intent != null ? intent.getStringExtra("url") : null;
        if (url != null) {
            webView.loadUrl(url);
        }
    }
}
