/**
 * PWA Bridge - JavaScript interface for Shillong Teer India Android App
 * 
 * This file provides a bridge between the web application and native Android features.
 * It should be included in the web application to enable offline functionality.
 */

// Ensure the file runs in both web browser and WebView environment
(function() {
    // Check if running in Android WebView
    const isAndroidApp = typeof Android !== 'undefined' && Android !== null;
    const isSQLiteAvailable = typeof SQLiteDB !== 'undefined' && SQLiteDB !== null;
    
    // Create a global object to hold our bridge functionality
    window.TeerAppBridge = {
        // Flag to check if we're running in the Android app
        isNativeApp: isAndroidApp,
        
        // Flag to check if SQLite is available
        isSQLiteAvailable: isSQLiteAvailable,
        
        // Show a toast message (Android only)
        showToast: function(message) {
            if (isAndroidApp && typeof Android.showToast === 'function') {
                Android.showToast(message);
                return true;
            }
            // Fallback for browser
            console.log('[Toast]', message);
            return false;
        },
        
        // Get device info (Android only)
        getDeviceInfo: function() {
            if (isAndroidApp && typeof Android.getDeviceInfo === 'function') {
                return Android.getDeviceInfo();
            }
            // Fallback for browser
            return 'Browser Environment';
        },
        
        // Database operations
        db: {
            // Execute a SQL query
            executeQuery: function(query, params = []) {
                return new Promise((resolve, reject) => {
                    if (isSQLiteAvailable && typeof SQLiteDB.executeQuery === 'function') {
                        try {
                            const paramsJson = JSON.stringify(params);
                            const resultJson = SQLiteDB.executeQuery(query, paramsJson);
                            const result = JSON.parse(resultJson);
                            
                            if (result.success) {
                                resolve(result.data ? JSON.parse(result.data) : []);
                            } else {
                                reject(new Error(result.error || 'Database query failed'));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        // Fallback to IndexedDB or other web storage in browser
                        reject(new Error('SQLite database not available'));
                    }
                });
            },
            
            // Create a user
            createUser: function(username, password) {
                return new Promise((resolve, reject) => {
                    if (isSQLiteAvailable && typeof SQLiteDB.createUser === 'function') {
                        try {
                            const resultJson = SQLiteDB.createUser(username, password);
                            const result = JSON.parse(resultJson);
                            
                            if (result.success) {
                                resolve(true);
                            } else {
                                reject(new Error(result.error || 'Failed to create user'));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        // Fallback to IndexedDB or other web storage in browser
                        reject(new Error('SQLite database not available'));
                    }
                });
            },
            
            // Place a bet
            placeBet: function(userId, amount, numbers, round, date) {
                return new Promise((resolve, reject) => {
                    if (isSQLiteAvailable && typeof SQLiteDB.placeBet === 'function') {
                        try {
                            const resultJson = SQLiteDB.placeBet(userId, amount, numbers, round, date);
                            const result = JSON.parse(resultJson);
                            
                            if (result.success) {
                                resolve(true);
                            } else {
                                reject(new Error(result.error || 'Failed to place bet'));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        // Fallback to IndexedDB or other web storage in browser
                        reject(new Error('SQLite database not available'));
                    }
                });
            },
            
            // Save a result
            saveResult: function(date, firstRound, secondRound) {
                return new Promise((resolve, reject) => {
                    if (isSQLiteAvailable && typeof SQLiteDB.saveResult === 'function') {
                        try {
                            const resultJson = SQLiteDB.saveResult(date, firstRound, secondRound);
                            const result = JSON.parse(resultJson);
                            
                            if (result.success) {
                                resolve(true);
                            } else {
                                reject(new Error(result.error || 'Failed to save result'));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        // Fallback to IndexedDB or other web storage in browser
                        reject(new Error('SQLite database not available'));
                    }
                });
            }
        }
    };
    
    console.log('Shillong Teer PWA Bridge initialized');
    if (isAndroidApp) {
        console.log('Running in Android WebView environment');
    } else {
        console.log('Running in browser environment');
    }
})();