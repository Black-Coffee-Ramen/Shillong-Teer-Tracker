// Service Worker for Shillong Teer India
const CACHE_NAME = 'shillong-teer-cache-v1';
const OFFLINE_PAGE = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/app-icon.svg',
  '/icons/app-icon-192.png',
  '/icons/app-icon-512.png',
  '/assets/index.css',
  '/assets/index.js'
];

// Install event - cache key assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  // Activate the SW immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Function for network-first with timeout fallback strategy
function networkFirstWithTimeout(request, timeout, cacheName) {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            resolve(cachedResponse);
          }
        });
    }, timeout);

    fetch(request)
      .then((response) => {
        clearTimeout(timeoutId);
        
        const responseClone = response.clone();
        caches.open(cacheName)
          .then((cache) => {
            cache.put(request, responseClone);
          });
          
        resolve(response);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        caches.match(request)
          .then((cachedResponse) => {
            resolve(cachedResponse || caches.match(OFFLINE_PAGE));
          });
      });
  });
}

// Fetch event - handle offline support
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // API requests - try network first with a timeout
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      networkFirstWithTimeout(event.request, 3000, CACHE_NAME)
        .catch(() => {
          return caches.match(OFFLINE_PAGE);
        })
    );
    return;
  }
  
  // For HTML navigation requests, use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_PAGE);
        })
    );
    return;
  }
  
  // For all other requests - use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Cache the fetched response
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // For images, return a placeholder
            if (event.request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#333333">Image Offline</text></svg>',
                {
                  headers: { 'Content-Type': 'image/svg+xml' }
                }
              );
            }
            return new Response('Content not available offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle online event - sync offline data
self.addEventListener('online', () => {
  syncOfflineData();
});

// Sync offline data when detected back online
async function syncOfflineData() {
  try {
    // Sync offline bets
    await syncBets();
    
    // Notify client that sync is complete
    const client = await self.clients.matchAll();
    client.forEach(c => {
      c.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Your offline data has been synchronized.'
      });
    });
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
}

// Sync offline bets with the server
async function syncBets() {
  // Open IndexedDB
  const openRequest = indexedDB.open('shillong-teer-app', 1);
  
  return new Promise((resolve, reject) => {
    openRequest.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    openRequest.onsuccess = async (event) => {
      const db = event.target.result;
      
      try {
        // Get all offline bets
        const transaction = db.transaction('offline-bets', 'readwrite');
        const store = transaction.objectStore('offline-bets');
        const offlineBets = await new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        // If there are no offline bets, return early
        if (!offlineBets || offlineBets.length === 0) {
          return resolve();
        }
        
        // Process each offline bet
        for (const bet of offlineBets) {
          try {
            // Send bet to server
            const response = await fetch('/api/bets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                number: bet.number,
                amount: bet.amount,
                round: bet.round
              })
            });
            
            if (response.ok) {
              // Delete successful bet from IndexedDB
              await new Promise((resolve, reject) => {
                const deleteRequest = store.delete(bet.id);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });
            }
          } catch (error) {
            console.error('Failed to sync bet:', bet, error);
            // Not rejecting the promise to allow other bets to sync
          }
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    };
  });
}

// Listen for background sync event (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bets') {
    event.waitUntil(syncBets());
  }
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    syncOfflineData();
  }
});