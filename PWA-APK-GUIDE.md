# PWA to APK Guide for Shillong Teer India

This document provides an overview of the PWA features in Shillong Teer India and how they are leveraged when converting to an Android APK.

## Progressive Web App Features

Shillong Teer India is built as a Progressive Web App with the following key features:

### 1. Offline Functionality

The app works offline thanks to the following implementations:

- **Service Worker**: Caches static assets and API responses
- **IndexedDB**: Stores user data, bets, and recent results locally
- **Background Sync**: Queues operations (like placing bets) when offline
- **Offline UI**: Shows appropriate offline indicators and fallback content

### 2. Installability

The app can be installed on devices through:

- **Web App Manifest**: Defines app properties like name, icons, colors
- **Install Prompt**: Appears when users meet certain engagement criteria
- **A2HS (Add to Home Screen)**: Available on compatible browsers

### 3. App-like Experience

The app provides a native-like user experience through:

- **Standalone Mode**: Runs without browser UI when installed
- **Splash Screen**: Custom splash screen during app load
- **Theme Colors**: Consistent branding with orange (#FF6B00) accent
- **Responsive Design**: Works on all device sizes
- **Fast Navigation**: Client-side routing for instant page transitions

### 4. Performance Optimizations

- **Lazy Loading**: Components and routes load on demand
- **Asset Optimization**: Compressed images and minified code
- **Caching Strategies**: Different strategies for different resource types
- **Prefetching**: Critical resources are loaded ahead of time

### 5. Engagement Features

- **Push Notifications**: For result announcements and winning bets
- **Home Screen Shortcuts**: Quick access to key app features
- **Shareable Content**: Results can be shared via Web Share API

## Converting from PWA to APK

### Why Convert to APK?

While a PWA offers many advantages, converting to an APK provides:

1. **Discovery in App Stores**: Reach users who search on Google Play
2. **Familiar Installation**: Many users are more comfortable with traditional app stores
3. **System Integration**: Better integration with Android features and settings
4. **Trust Signal**: Some users perceive store apps as more trustworthy

### TWA (Trusted Web Activity)

The conversion uses a Trusted Web Activity, which:

- Is a special Chrome custom tab that runs in full-screen
- Requires validated ownership via Digital Asset Links
- Preserves all PWA features while providing native app packaging
- Has minimal overhead compared to WebView-based approaches

### Key Components Preserved in the APK

When converted to an APK, these PWA features continue to work:

| PWA Feature | APK Implementation |
|-------------|-------------------|
| Service Worker | Works identically in TWA |
| Web App Manifest | Used to configure APK settings |
| IndexedDB | Full access preserved |
| Push Notifications | Works with FCM registration |
| Background Sync | Maintained with same functionality |
| Offline Support | Full offline capabilities preserved |

### Digital Asset Links

Digital Asset Links is the critical component that proves your website and Android app belong to the same owner:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.shillongteerindia.app",
    "sha256_cert_fingerprints": ["YOUR:CERTIFICATE:FINGERPRINT"]
  }
}]
```

This file must be hosted at `https://yourdomain.com/.well-known/assetlinks.json`

## Offline Mode Details

### Offline Storage Design

Shillong Teer India uses a multi-layered approach for offline functionality:

1. **Cache Storage API**: 
   - Static assets (HTML, CSS, JS, images)
   - API response data for results and game information
   - Fallback UI for network errors

2. **IndexedDB**:
   - User profile information
   - Transaction history
   - Pending bets placed while offline
   - Historical results for analysis

### Background Synchronization

When the app goes offline:

1. User can continue browsing cached content
2. Bets are stored in IndexedDB with a "pending" status
3. Background Sync API registers a sync event
4. When connectivity returns, the service worker:
   - Wakes up and processes the sync queue
   - Sends pending bets to the server
   - Updates local storage with confirmation
   - Triggers notifications for successful/failed syncs

### Sync Process Technical Implementation

The core sync algorithm follows these steps:

```javascript
// Service worker background sync registration
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bets') {
    event.waitUntil(syncOfflineData());
  }
});

// Main sync function
async function syncOfflineData() {
  // Gets all pending bets from IndexedDB
  const pendingBets = await getOfflineItems(db, 'bets');
  
  // Process each bet
  for (const bet of pendingBets) {
    try {
      // Attempt to send to server
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bet)
      });
      
      if (response.ok) {
        // On success, remove from pending queue
        await deleteOfflineItem(db, 'bets', bet.id);
        
        // Notify user of successful sync
        self.registration.showNotification('Bet Synchronized', {
          body: `Your bet on numbers ${bet.numbers.join(', ')} has been placed successfully.`,
          icon: '/icons/app-icon-96.png'
        });
      }
    } catch (error) {
      // If still offline, keep in queue for next sync attempt
      console.error('Sync failed for bet:', bet.id);
    }
  }
  
  // Update sync status
  await updateOfflineStatus();
}
```

## APK Testing Checklist

Before distributing your APK, test these scenarios:

### Offline Testing

- [ ] Force stop the app, enable airplane mode, then reopen
- [ ] Verify all critical UI elements appear properly
- [ ] Try to navigate between previously visited screens
- [ ] Place a bet while offline
- [ ] Disable airplane mode and verify the bet syncs
- [ ] Check that notifications appear after sync

### Performance Testing

- [ ] Cold start time (first launch after install)
- [ ] Warm start time (app already in memory)
- [ ] Smoothness of animations and transitions
- [ ] Memory usage over extended sessions
- [ ] Battery impact during normal usage

### Feature Testing

- [ ] Login/Registration
- [ ] Account management
- [ ] Number selection UI
- [ ] Bet placement
- [ ] Results viewing
- [ ] Transaction history
- [ ] Settings and preferences

## Advanced APK Customization

For future enhancements, consider:

1. **Native Functionality**: Add Android-specific features using the TWA's ability to communicate with native code

2. **Custom Splash Screen**: Replace the default TWA splash with a custom branded one

3. **App Shortcuts**: Define Android App Shortcuts for quick actions from the home screen

4. **Notification Channels**: Create custom notification channels for different alert types

5. **Enhanced Permissions**: Request additional Android permissions for features like camera access (for scanning UPI QR codes)

## Resources

For more information on PWA to APK conversion:

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Trusted Web Activities](https://developers.google.com/web/android/trusted-web-activity)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Offline Web Applications](https://web.dev/offline-cookbook/)
- [Background Sync API](https://developers.google.com/web/updates/2015/12/background-sync)