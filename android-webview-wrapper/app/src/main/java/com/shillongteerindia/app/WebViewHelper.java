package com.shillongteerindia.app;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Build;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Helper class for configuring and loading local assets in WebView.
 * This class handles loading web content from the APK's assets folder.
 */
public class WebViewHelper {
    private static final String TAG = "WebViewHelper";
    private static final String DOMAIN = "appassets.shillongteerindia";
    private static final String BASE_URL = "https://" + DOMAIN + "/";
    private static final String APP_URL = BASE_URL + "assets/index.html";
    
    private Context context;
    private WebView webView;
    private WebViewAssetLoader assetLoader;

    public WebViewHelper(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
    }

    /**
     * Set up the WebView with asset loader and JavaScript interface
     */
    public void setup() {
        // Create asset loader to serve files from APK assets
        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(context))
                .addPathHandler("/res/", new WebViewAssetLoader.ResourcesPathHandler(context))
                .setDomain(DOMAIN)
                .build();
        
        // Setup the JavaScript interface for native features
        setupJavascriptInterface();
        
        // Set a WebViewClient to intercept and handle URL requests
        webView.setWebViewClient(new LocalContentWebViewClient(assetLoader));
    }
    
    /**
     * Add JavaScript interface to allow web app to access native features
     */
    private void setupJavascriptInterface() {
        webView.addJavascriptInterface(new WebAppInterface(), "Android");
    }
    
    /**
     * Load the PWA from assets folder
     */
    public void loadApp() {
        webView.loadUrl(APP_URL);
    }
    
    /**
     * WebViewClient that intercepts requests and loads content from assets
     */
    private static class LocalContentWebViewClient extends WebViewClient {
        private final WebViewAssetLoader assetLoader;
        
        LocalContentWebViewClient(WebViewAssetLoader assetLoader) {
            this.assetLoader = assetLoader;
        }
        
        @Override
        @RequiresApi(21)
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return assetLoader.shouldInterceptRequest(request.getUrl());
        }
        
        // For API < 21
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            if (url != null) {
                return assetLoader.shouldInterceptRequest(android.net.Uri.parse(url));
            }
            return null;
        }
        
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            // Keep local URLs in the WebView, let external URLs open in browser
            if (url.startsWith(BASE_URL)) {
                return false;
            }
            
            // External URL handling would go here
            return true;
        }
        
        @Override
        @RequiresApi(21)
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return shouldOverrideUrlLoading(view, request.getUrl().toString());
        }
    }
    
    /**
     * JavaScript interface to expose native Android features to the web app
     */
    private class WebAppInterface {
        /**
         * Show a toast message
         */
        @JavascriptInterface
        public void showToast(String message) {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        }
        
        /**
         * Get device information
         */
        @JavascriptInterface
        public String getDeviceInfo() {
            return Build.MANUFACTURER + " " + Build.MODEL + " (Android " + Build.VERSION.RELEASE + ")";
        }
    }
}