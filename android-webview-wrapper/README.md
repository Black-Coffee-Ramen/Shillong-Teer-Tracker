# Shillong Teer India Android WebView App

This Android application loads the Shillong Teer India web application directly from the APK's assets folder, with no need for internet connectivity or web hosting.

## How It Works

- The web application is packaged directly in the APK's assets folder
- Android WebView loads and displays the web content
- A JavaScript bridge enables communication between the web app and native Android features
- SQLite database integration provides persistent local storage 
- Offline functionality is maintained through proper caching and service worker support

## Project Structure

- `app/src/main/java` - Java source code for the Android application
  - `MainActivity.java` - Main activity with WebView setup
  - `WebViewHelper.java` - Helper for loading assets in WebView
  - `DatabaseHelper.java` - SQLite database integration
  
- `app/src/main/assets` - Web application files
  - `index.html` - Entry point for the web application
  - `pwa-bridge.js` - JavaScript bridge for web-to-native communication
  - Web assets (JavaScript, CSS, images, etc.)
  
- `app/src/main/res` - Android resources
  - `layout/activity_main.xml` - Main layout with WebView
  - `values/strings.xml` - App strings
  - `values/styles.xml` - App theme and styles
  
- `app/src/main/AndroidManifest.xml` - App manifest file

## Building the APK

1. Make sure the web application is built and copied to the assets folder
   - Use the provided script: `./scripts/build-webview-apk.sh`

2. Open the project in Android Studio
   - For easy import, use: `./scripts/export-to-android-studio.sh`
   
3. Build the APK in Android Studio
   - Choose Build > Build Bundle(s) / APK(s) > Build APK(s)
   
4. The debug APK will be in `app/build/outputs/apk/debug/`

## Customizing the App

- App name: Edit `app/src/main/res/values/strings.xml`
- App theme: Edit `app/src/main/res/values/styles.xml`
- App icon: Replace files in `app/src/main/res/mipmap/`
- Package name: Update in `app/build.gradle` and refactor directories

## JavaScript Bridge API

The web application can access native Android features through the JavaScript bridge:

```javascript
// Check if running in Android WebView
if (window.TeerAppBridge && TeerAppBridge.isNativeApp) {
    // Show a toast message
    TeerAppBridge.showToast("Hello from the web app!");
    
    // Get device info
    const deviceInfo = TeerAppBridge.getDeviceInfo();
    
    // Use SQLite database
    if (TeerAppBridge.isSQLiteAvailable) {
        TeerAppBridge.db.executeQuery("SELECT * FROM users")
            .then(results => {
                console.log("Users:", results);
            })
            .catch(err => {
                console.error("Error:", err);
            });
    }
}
```