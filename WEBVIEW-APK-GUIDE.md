# Shillong Teer India - WebView APK Guide

This guide explains how to create a fully offline Android APK using a WebView wrapper that works completely without an internet connection. Your entire web application will be packaged inside the APK, allowing users to install and use it without any server.

## Advantages of This Approach

This implementation offers several key advantages over other methods:

1. **100% Offline Operation**: Works without any internet connection or server
2. **Direct Distribution**: APK can be shared directly with customers via WhatsApp, email, etc.
3. **No Hosting Required**: No need for website hosting, domain registration, or SSL certificates
4. **Native Database**: Uses Android's SQLite for persistent storage
5. **Easy Updates**: Simply rebuild the APK with new web content and redistribute

## How it Works

Unlike the TWA approach (which requires a web server), this method:

1. **Packages Everything Locally**: Your entire web application is stored inside the APK
2. **Uses WebView**: Android's WebView component displays the web content
3. **Loads from Assets**: All content is loaded directly from the APK's assets folder
4. **Preserves PWA Features**: Service workers, offline functionality, and other PWA features are maintained
5. **Adds Native Capabilities**: JavaScript bridge enables web-to-native communication

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (for building your web app)
2. **Java Development Kit (JDK)** (version 8 or higher)
3. **Android Studio** (for building the APK)
4. **Android SDK** (installed via Android Studio)

## Building the WebView APK

### Option 1: Using Scripts (Recommended)

We've created scripts to automate most of the process:

1. Make the scripts executable:
   ```bash
   chmod +x scripts/build-webview-apk.sh
   chmod +x scripts/export-to-android-studio.sh
   ```

2. Run the building script:
   ```bash
   ./scripts/build-webview-apk.sh
   ```
   
   This script:
   - Builds your web application
   - Copies the built files to the Android assets directory
   - Injects the JavaScript bridge
   - Prepares the Android project for building

3. Use the export script if you want to open in Android Studio:
   ```bash
   ./scripts/export-to-android-studio.sh
   ```
   
   This creates a zip file you can extract and open in Android Studio.

### Option 2: Manual Process

If you prefer more control:

1. Build your web application:
   ```bash
   npm run build
   ```

2. Create the assets directory in the Android project:
   ```bash
   mkdir -p android-webview-wrapper/app/src/main/assets
   ```

3. Copy your built files to the assets directory:
   ```bash
   cp -r dist/* android-webview-wrapper/app/src/main/assets/
   ```

4. Ensure pwa-bridge.js is in the assets directory and referenced in your HTML files.

5. Open the `android-webview-wrapper` project in Android Studio.

6. Build the APK using Android Studio's build functions.

## Android Project Structure

The Android project is structured as follows:

```
android-webview-wrapper/
├── app/
│   ├── build.gradle                 # App-level Gradle build file
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml  # App manifest file
│           ├── assets/              # Web app files go here
│           │   ├── index.html       # Main HTML file
│           │   ├── pwa-bridge.js    # JavaScript bridge for native features
│           │   └── ...              # Other web assets
│           ├── java/
│           │   └── com/shillongteerindia/app/
│           │       ├── MainActivity.java     # Main activity with WebView
│           │       ├── WebViewHelper.java    # Helper for WebView handling
│           │       └── DatabaseHelper.java   # SQLite database integration
│           └── res/
│               ├── layout/
│               │   └── activity_main.xml     # Main layout with WebView
│               └── values/
│                   ├── strings.xml   # App strings
│                   └── styles.xml    # App theme colors
├── build.gradle                     # Project-level Gradle build file
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties
└── settings.gradle                  # Gradle settings file
```

## How the WebView Integration Works

The WebView implementation uses several key components:

1. **WebViewAssetLoader**: Maps assets from the APK to a domain-like URL structure, allowing proper loading of resources with relative paths.
2. **Custom WebViewClient**: Intercepts URL requests and loads content from assets instead of making network requests.
3. **Service Worker Support**: Enables offline capabilities and PWA features through proper configuration.
4. **JavaScript Interface**: Allows the web app to call native Android functions through the `window.TeerAppBridge` object.
5. **SQLite Database**: Provides persistent storage directly within the app.

The main URL format used internally is: `https://appassets.shillongteerindia/assets/index.html`

## Offline Database Integration

The app includes a complete SQLite database implementation that:

1. Creates database tables matching your web app's data model
2. Provides JavaScript methods to query and manipulate data
3. Maintains data persistence across app restarts
4. Allows the web app to work completely offline

The database schema includes tables for:
- Users (authentication, profiles)
- Bets (user bets, amounts, numbers)
- Results (historical results by date)
- Transactions (financial records)

## Building and Signing for Distribution

To create a release APK for distribution:

1. In Android Studio, select **Build > Generate Signed Bundle/APK**.
2. Choose **APK** as the build type.
3. Create a new keystore or use an existing one:
   - Set a keystore path and password
   - Create a key with alias and password
   - Fill in certificate information
4. Choose **release** build variant.
5. The signed APK will be generated in `android-webview-wrapper/app/release/`.

## Distributing the APK

Once you have your signed APK:

1. **Direct Distribution**: Share the APK file directly through WhatsApp, email, or file sharing.
2. **Website Download**: Host the APK on your website for users to download.
3. **Alternative Stores**: Submit to alternative Android app stores if desired.

**Note**: Always sign your APK with the same key for updates, as Android requires consistency for app updates.

## Customizing the App

To customize the app appearance:

1. **App Icon**: Replace the icon files in `app/src/main/res/mipmap/`.
2. **App Name**: Edit `app/src/main/res/values/strings.xml`.
3. **Theme Colors**: Edit `app/src/main/res/values/styles.xml` (currently using orange #FF6B00).
4. **Package Name**: Change `com.shillongteerindia.app` in build.gradle and manifest.
5. **Splash Screen**: Customize by editing styles and drawable resources.

## Troubleshooting

If you encounter issues:

1. **Building fails**: 
   - Make sure JDK is properly installed and JAVA_HOME is set
   - Ensure Android SDK is properly installed and ANDROID_HOME is set
   - Check Android Studio for SDK tool updates

2. **Web content doesn't load**: 
   - Verify the web files were correctly copied to assets
   - Check that index.html exists in the assets folder
   - Look for JavaScript errors in logcat

3. **JavaScript errors**: 
   - Ensure your web app doesn't rely on external resources
   - Check that pwa-bridge.js is properly referenced

4. **Service worker issues**: 
   - Verify the service worker is properly registered
   - Check the cache paths are correct for asset URLs

5. **Database connection fails**:
   - Check logcat for SQLite-related errors
   - Verify database tables were created correctly

## Using the JavaScript Bridge

The `pwa-bridge.js` file provides a JavaScript interface between your web app and native Android features:

```javascript
// Check if running in the Android app
if (window.TeerAppBridge && TeerAppBridge.isNativeApp) {
  // Show a toast message
  TeerAppBridge.showToast("Hello from the web app!");
  
  // Get device info
  const deviceInfo = TeerAppBridge.getDeviceInfo();
  
  // Use SQLite database
  if (TeerAppBridge.isSQLiteAvailable) {
    // Query users
    TeerAppBridge.db.executeQuery("SELECT * FROM users WHERE role = ?", ["admin"])
      .then(results => console.log("Admin users:", results))
      .catch(err => console.error("Error:", err));
    
    // Place a bet in the offline database
    TeerAppBridge.db.placeBet(userId, amount, "[1,2,3]", 1, "2023-05-07")
      .then(() => console.log("Bet saved"))
      .catch(err => console.error("Error saving bet:", err));
  }
}
```

For more details on integrating with the native features, see the `docs/webview-integration-guide.md` file.