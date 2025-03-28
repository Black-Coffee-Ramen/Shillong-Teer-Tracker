# Shillong Teer India - PWA and Android APK Guide

This document provides instructions on how to use the Progressive Web App (PWA) features of the Shillong Teer India app and how to convert it to an Android APK for distribution.

## Progressive Web App (PWA) Features

The Shillong Teer India app has been enhanced with Progressive Web App capabilities, which allow users to:

- Install the app on their device's home screen
- Use the app offline
- Receive push notifications
- Experience faster loading times through caching
- Background sync for offline bet placement

### How to Install the PWA

#### On Android:

1. Open the website in Chrome
2. Tap the menu button (three dots) in the top-right corner
3. Select "Add to Home Screen"
4. Follow the on-screen instructions to complete the installation

#### On iOS:

1. Open the website in Safari
2. Tap the share button at the bottom of the screen
3. Scroll down and select "Add to Home Screen"
4. Tap "Add" to confirm

### PWA Features Explained

- **Offline Support**: The app can be used even when there is no internet connection. It will display cached data and allow placing bets that will be synced when connection is restored.
- **Add to Home Screen**: Users will see a prompt to install the app on their device.
- **Background Sync**: Bets placed while offline will be synchronized to the server once the connection is restored.
- **Push Notifications**: Users can receive real-time notifications about results and winning bets.
- **Fast Loading**: The app uses service workers to cache assets, making subsequent visits much faster.

## Converting to Android APK

For broader distribution on Android devices, we've implemented a method to convert the PWA to a native Android APK using Bubblewrap, which creates a Trusted Web Activity (TWA).

### Prerequisites for APK Creation

1. Node.js (v14+)
2. Java Development Kit (JDK 8+)
3. Android SDK and NDK (can be installed via Android Studio)
4. Bubblewrap CLI (`npm install -g @bubblewrap/cli`)

### APK Build Process

We've simplified the APK creation process with a script:

```bash
# Install Bubblewrap CLI if you haven't already
npm run apk:install

# Build the APK
npm run apk:build
```

The build script handles:
1. Building the web app
2. Initializing a TWA project
3. Configuring the Android settings
4. Building the signed APK
5. Placing the final APK in the `dist` directory as `shillong-teer-india.apk`

### Key Features of the APK

- **Native-like Experience**: The APK provides a native Android app experience without the browser UI.
- **Offline Support**: Just like the PWA, the APK works offline.
- **Update Management**: Updates to the web app are automatically reflected in the APK without requiring users to download a new version.
- **App Store Distribution**: The APK can be submitted to the Google Play Store.

### Digital Asset Links

For the TWA to work properly, the web server needs to serve a Digital Asset Links file that verifies the association between the website and the Android app. This is done via the `.well-known/assetlinks.json` file which has been configured in the project.

## Technical Details

### Files Related to PWA/APK

- `public/manifest.json`: Web app manifest defining app properties
- `public/service-worker.js`: Service worker for caching and offline support
- `public/offline.html`: Offline fallback page
- `public/.well-known/assetlinks.json`: Digital Asset Links for Android TWA
- `public/icons/`: Various sized icons for different devices
- `scripts/build-android-apk.js`: Script to build the Android APK
- `workbox-config.js`: Configuration for Workbox (enhances the service worker)

### PWA Features Implementation

The core PWA features are implemented through:

1. **Service Worker**: Handles caching, offline support, and background sync
2. **Web Manifest**: Defines how the app appears when installed
3. **IndexedDB**: Stores offline bets for later synchronization
4. **Offline HTML**: Provides a friendly message when offline
5. **Push API**: Enables notifications

## Troubleshooting

### PWA Installation Issues

- If the install prompt doesn't appear, ensure you've visited the site multiple times and engaged with it.
- Make sure your browser supports PWAs (most modern browsers do).

### APK Build Issues

- Verify you have all prerequisites installed (JDK, Android SDK, etc.)
- Check that the paths in your environment variables are correctly set
- Ensure you're running the build script with appropriate permissions

### Offline Mode Not Working

- Check if the service worker is registered properly (look in browser DevTools)
- Clear cache and reload if updates aren't appearing

## Future Enhancements

- Implement push notification server
- Add more offline capabilities
- Enhance background sync for other operations
- Implement app update notifications