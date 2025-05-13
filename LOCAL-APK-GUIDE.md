# Shillong Teer India - Local APK Guide

This guide explains how to create an Android APK for the Shillong Teer India app that can run locally on your device without requiring an external web server or internet hosting.

## How it Works

The APK we'll build will:
1. Connect to a local server running on your computer
2. Use the same network as your computer (Wi-Fi)
3. Allow full offline functionality for cached content

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (v14 or higher)
2. **Java Development Kit (JDK)** (version 8 or higher)
   - Verify installation with: `java -version`
   - Set JAVA_HOME environment variable correctly
3. **Android SDK** (easiest to install via Android Studio)
   - Set ANDROID_HOME environment variable to your SDK location
4. **Bubblewrap CLI** (install via npm)
   ```bash
   npm install -g @bubblewrap/cli
   ```

## Building the APK

### Step 1: Find Your Local Network IP

Before building the APK, you should identify your local network IP address. We've created a simple utility for this:

```bash
node scripts/get-local-ip.js
```

This will display all your network interfaces and recommend the best IP address to use for local network connections. Make note of this IP address as it will be used in the APK configuration.

### Step 2: Build the APK

#### Option 1: Automated Script (Recommended)

We've created a helper script that automates the entire process:

1. Make the script executable (if it's not already):
   ```bash
   chmod +x scripts/build-local-apk.sh
   ```

2. Run the script:
   ```bash
   ./scripts/build-local-apk.sh
   ```

3. Follow the on-screen instructions.

### Option 2: Manual Process

If you prefer more control, follow these steps:

1. Start the local server:
   ```bash
   npm run dev
   ```
   Note which port the server is running on (it will log "serving on port XXXX").

2. Build the web app:
   ```bash
   npm run build
   ```

3. Run the Android APK build script:
   ```bash
   node scripts/build-android-apk.js
   ```

4. The APK will be generated at `dist/shillong-teer-india.apk`

## Installing and Using the APK

1. Transfer the APK (`dist/shillong-teer-india.apk`) to your Android device via USB, email, or other means.

2. On your Android device, you'll need to allow installation from unknown sources:
   - Go to Settings > Security > Install Unknown Apps
   - Select the app you'll use to install the APK (e.g., Files, Chrome) and toggle "Allow from this source"

3. Install the APK by opening it on your device.

4. **Important:** Before opening the app on your phone:
   - Make sure your computer and phone are on the same Wi-Fi network
   - Start the server on your computer with `npm run dev`
   - The server should be running on the IP address shown during the build process

5. Open the app on your Android device.

## How to Keep the App Functional

For the app to work correctly:
1. Your phone must be on the same network as the computer running the server
2. The server must be running (`npm run dev`)
3. The app will automatically connect to your local server

## Troubleshooting

If you encounter issues:

1. **App can't connect to server**:
   - Ensure your phone and computer are on the same Wi-Fi network
   - Check if your computer's firewall is blocking the connection
   - Run `node scripts/get-local-ip.js` to verify the IP address being used
   - Try visiting the IP:port (e.g., http://192.168.1.100:3000) in your phone's browser to test connectivity
   - Try using a different port if 3000 is blocked (the app will automatically try ports 3000, 3001, 3002, 5000, and 8080)
   - Some corporate or public Wi-Fi networks block communication between devices - try using a home network

2. **Build errors**:
   - Check Java and Android SDK environment variables are set correctly:
     - JAVA_HOME should point to your JDK installation
     - ANDROID_HOME or ANDROID_SDK_ROOT should point to your Android SDK installation
   - Make sure Bubblewrap CLI is installed properly: `npm install -g @bubblewrap/cli`
   - Run `bubblewrap doctor` to check for any issues with your environment
   - Look at error messages in the terminal for specific issues

3. **Installation issues**:
   - Make sure unknown sources are enabled on your Android device
   - If you get "App not installed", uninstall any previous version first
   - Some Android devices may block installations from unknown sources even if enabled - try using a different method to transfer the APK
   - Check if your Android version is compatible (the APK requires Android 5.0+)

4. **Service worker issues**:
   - If the app doesn't work offline, make sure the service worker is registered correctly
   - Check the browser console in the development environment for any errors
   - The app may need to be used online first to cache resources before working offline

5. **TWA configuration issues**:
   - If the app doesn't open in full-screen mode, check the assetlinks.json file configuration
   - Make sure the package name and fingerprint match between the APK and assetlinks.json
   - Verify that the manifest.json file has the correct display and theme settings

## Additional Notes

- The app uses the TWA (Trusted Web Activity) technology to wrap your PWA in an Android container
- Your server's IP address is automatically detected and configured in the APK
- The app will work offline for previously cached content