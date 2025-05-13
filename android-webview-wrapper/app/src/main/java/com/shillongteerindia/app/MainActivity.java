package com.shillongteerindia.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String TAG = "MainActivity";
    private WebView webView;
    private WebViewHelper webViewHelper;
    private DatabaseHelper dbHelper;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize SQLite database
        dbHelper = new DatabaseHelper(this);
        
        // Create the WebView
        webView = findViewById(R.id.webview);
        
        // Configure WebView settings
        configureWebView();
        
        // Attach database helper to WebView
        dbHelper.attachToWebView(webView);
        
        // Setup WebView helper for local assets
        webViewHelper = new WebViewHelper(this, webView);
        webViewHelper.setup();
        
        // Configure service worker support for offline functionality
        setupServiceWorkerSupport();

        // Log startup info
        Log.i(TAG, "WebView app started - loading local assets");
        
        try {
            // Load the PWA from assets
            webViewHelper.loadApp();
            Log.i(TAG, "App loaded successfully from assets");
        } catch (Exception e) {
            Log.e(TAG, "Error loading app: " + e.getMessage());
            Toast.makeText(this, "Error loading application", Toast.LENGTH_LONG).show();
        }
    }
    
    /**
     * Configure WebView settings for optimal PWA experience
     */
    private void configureWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // Enable JavaScript and DOM Storage
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        
        // Enable offline caching
        webSettings.setAppCacheEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setDatabaseEnabled(true);
        
        // Support for IndexedDB
        webSettings.setDatabaseEnabled(true);
        
        // Support modern web features
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        
        // Enable media playback
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        
        // Enable geolocation
        webSettings.setGeolocationEnabled(true);
        
        // Enable app cache
        String appCachePath = getApplicationContext().getCacheDir().getAbsolutePath();
        webSettings.setAppCachePath(appCachePath);
        
        // Set cache size to 8MB
        webSettings.setAppCacheMaxSize(8 * 1024 * 1024);
        
        // Enable mixed content mode for API level 21+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        
        // Set user agent to improve compatibility
        String userAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(userAgent + " ShillongTeerApp");
    }
    
    /**
     * Setup Service Worker support for modern PWA features
     */
    private void setupServiceWorkerSupport() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            ServiceWorkerController controller = ServiceWorkerController.getInstance();
            controller.setServiceWorkerClient(new ServiceWorkerClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return null; // Let the WebViewHelper handle the requests
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Clean up resources
        if (webView != null) {
            webView.destroy();
        }
    }
}