# WebView Integration Guide

This guide explains how to integrate your web application with the Android WebView wrapper to enable fully offline functionality.

## Understanding the WebView Bridge

The Android WebView wrapper loads your web application directly from the APK's assets folder. A JavaScript bridge (`pwa-bridge.js`) is automatically injected into your HTML files to enable communication between your web app and native Android features.

## Integration Steps

### 1. Detect the WebView Environment

First, check if your app is running in the WebView:

```javascript
// Check if running in Android WebView
const isRunningInWebView = window.TeerAppBridge && TeerAppBridge.isNativeApp;

if (isRunningInWebView) {
  console.log("Running in Android WebView!");
  // Enable WebView-specific features
} else {
  console.log("Running in browser!");
  // Continue with browser behavior
}
```

### 2. Modify API Requests for Offline Mode

When your app is running in the WebView, you should route API requests to the local SQLite database:

```javascript
async function fetchData(endpoint, options = {}) {
  // Check if running in WebView with SQLite available
  if (window.TeerAppBridge && TeerAppBridge.isSQLiteAvailable) {
    // Use the appropriate query based on the endpoint
    if (endpoint === '/api/users') {
      try {
        const results = await TeerAppBridge.db.executeQuery("SELECT * FROM users");
        return { data: results };
      } catch (error) {
        console.error("Database error:", error);
        throw error;
      }
    }
    // Handle other endpoints similarly
  } 
  
  // Fall back to regular fetch for browser environment
  return fetch(endpoint, options).then(res => res.json());
}
```

### 3. Update Storage Mechanism

For offline persistence, use the SQLite database when available:

```javascript
// User authentication example
async function loginUser(username, password) {
  if (window.TeerAppBridge && TeerAppBridge.isSQLiteAvailable) {
    try {
      // Query the SQLite database for the user
      const query = "SELECT * FROM users WHERE username = ?";
      const users = await TeerAppBridge.db.executeQuery(query, [username]);
      
      if (users.length > 0 && comparePassword(password, users[0].password)) {
        // User authenticated
        return users[0];
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  } else {
    // Regular API login for browser environment
    return fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(res => res.json());
  }
}
```

### 4. Implement Cross-Platform Storage

Create helper functions that work in both environments:

```javascript
// Storage utility
const Storage = {
  setItem: async (key, value) => {
    // Store in local SQLite if available
    if (window.TeerAppBridge && TeerAppBridge.isSQLiteAvailable) {
      try {
        // For simple key-value storage
        await TeerAppBridge.db.executeQuery(
          "INSERT OR REPLACE INTO app_storage (key, value) VALUES (?, ?)",
          [key, JSON.stringify(value)]
        );
        return true;
      } catch (error) {
        console.error("Storage error:", error);
      }
    }
    
    // Fall back to localStorage
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  },
  
  getItem: async (key) => {
    // Get from SQLite if available
    if (window.TeerAppBridge && TeerAppBridge.isSQLiteAvailable) {
      try {
        const results = await TeerAppBridge.db.executeQuery(
          "SELECT value FROM app_storage WHERE key = ?",
          [key]
        );
        
        if (results.length > 0) {
          return JSON.parse(results[0].value);
        }
        return null;
      } catch (error) {
        console.error("Storage error:", error);
      }
    }
    
    // Fall back to localStorage
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  
  removeItem: async (key) => {
    // Remove from SQLite if available
    if (window.TeerAppBridge && TeerAppBridge.isSQLiteAvailable) {
      try {
        await TeerAppBridge.db.executeQuery(
          "DELETE FROM app_storage WHERE key = ?",
          [key]
        );
        return true;
      } catch (error) {
        console.error("Storage error:", error);
      }
    }
    
    // Also remove from localStorage
    localStorage.removeItem(key);
    return true;
  }
};
```

### 5. Access Native Features

Use the bridge to access native Android features:

```javascript
// Show a toast message
function showNotification(message) {
  if (window.TeerAppBridge && TeerAppBridge.isNativeApp) {
    TeerAppBridge.showToast(message);
  } else {
    // Use a web notification or alert instead
    alert(message);
  }
}

// Get device information
function getDeviceInfo() {
  if (window.TeerAppBridge && TeerAppBridge.isNativeApp) {
    return TeerAppBridge.getDeviceInfo();
  } else {
    return navigator.userAgent;
  }
}
```

## Testing WebView Integration

Before building the APK, you can test your integration by adding a local version of the bridge script to your web application:

1. Create a test version of `pwa-bridge.js` with mock implementations
2. Include it in your HTML files during development
3. Test offline functionality in your browser
4. Once verified, build the APK with the real bridge

## Common Integration Patterns

### Authentication

Store authentication tokens in both environments:

```javascript
async function storeAuthToken(token) {
  return Storage.setItem('auth_token', token);
}

async function getAuthToken() {
  return Storage.getItem('auth_token');
}

async function isLoggedIn() {
  const token = await getAuthToken();
  return !!token;
}
```

### Betting Transactions

Handle bets consistently across environments:

```javascript
async function placeBet(userId, amount, numbers, round, date) {
  if (window.TeerAppBridge && TeerAppBridge.isSQLiteAvailable) {
    try {
      // Place bet in SQLite
      return TeerAppBridge.db.placeBet(userId, amount, numbers, round, date);
    } catch (error) {
      console.error("Bet error:", error);
      throw error;
    }
  } else {
    // Regular API call for browser
    return fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, numbers, round, date })
    }).then(res => res.json());
  }
}
```

## Conclusion

By following this guide, your web application will work seamlessly in both:
1. Regular browser environment with server API calls
2. Android WebView with fully offline SQLite database

The app will automatically detect the environment and use the appropriate APIs, providing a consistent user experience across platforms.