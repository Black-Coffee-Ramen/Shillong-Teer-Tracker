import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';
import { Button } from '@/components/ui/button';

export interface OfflineStatus {
  isOffline: boolean;
  lastSyncTime: Date | null;
  pendingSyncItems: number;
}

// Create a global offline status object that can be accessed from anywhere
export const offlineStatus: OfflineStatus = {
  isOffline: !navigator.onLine,
  lastSyncTime: null,
  pendingSyncItems: 0
};

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(offlineStatus.isOffline);
  const [showBanner, setShowBanner] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingItems, setPendingItems] = useState(0);
  const { addNotification } = useNotification();

  // Check for pending offline items in IndexedDB
  const checkPendingItems = async () => {
    try {
      if (!('indexedDB' in window)) return;

      const dbRequest = indexedDB.open('shillong-teer-app', 1);
      
      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('offline-bets')) return;
        
        const transaction = db.transaction('offline-bets', 'readonly');
        const store = transaction.objectStore('offline-bets');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
          const count = countRequest.result;
          setPendingItems(count);
          offlineStatus.pendingSyncItems = count;
        };
      };
    } catch (error) {
      console.error('Error checking pending items:', error);
    }
  };

  // Trigger manual sync with service worker
  const triggerSync = () => {
    if (syncInProgress || isOffline) return;
    
    setSyncInProgress(true);
    addNotification('Synchronizing offline data...', 'info');
    
    // Send message to service worker to trigger sync
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_NOW'
      });
    }
    
    // After a timeout, check pending items again and update status
    setTimeout(() => {
      checkPendingItems();
      setSyncInProgress(false);
      offlineStatus.lastSyncTime = new Date();
      addNotification('Sync complete', 'info');
    }, 2000);
  };

  useEffect(() => {
    // Initial check
    setIsOffline(!navigator.onLine);
    offlineStatus.isOffline = !navigator.onLine;
    checkPendingItems();
    
    // Setup event listeners for online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      offlineStatus.isOffline = false;
      setShowBanner(true);
      addNotification('You are back online. Synchronizing data...', 'info', true);
      
      // When coming back online, trigger sync after a short delay
      setTimeout(() => {
        triggerSync();
      }, 1000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      offlineStatus.isOffline = true;
      setShowBanner(true);
      addNotification('You are offline. The app will continue to work with limited functionality.', 'warning', true);
    };
    
    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        checkPendingItems();
        offlineStatus.lastSyncTime = new Date();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    // Regular check for pending items
    const pendingCheckInterval = setInterval(() => {
      if (!isOffline) {
        checkPendingItems();
      }
    }, 30000); // Check every 30 seconds when online
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      
      clearInterval(pendingCheckInterval);
    };
  }, [addNotification]);

  // Hide the banner after 5 seconds if a notification was shown
  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showBanner]);

  // Always render a hidden div with the offline status for JavaScript access
  return (
    <>
      <div id="offline-status" data-is-offline={isOffline.toString()} style={{ display: 'none' }}></div>
      
      {showBanner && (
        <div className={`fixed top-0 inset-x-0 z-50 p-4 transition-opacity duration-300 ${showBanner ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`rounded-lg p-4 flex items-center justify-between ${isOffline ? 'bg-red-500' : 'bg-green-500'} text-white shadow-lg`}>
            <div className="flex items-center">
              {isOffline ? <WifiOff className="mr-2 h-5 w-5" /> : <AlertCircle className="mr-2 h-5 w-5" />}
              <p>
                {isOffline 
                  ? 'You are currently offline. Some features may be limited.' 
                  : 'You are back online. Your data will be synchronized.'}
              </p>
            </div>
            <button 
              onClick={() => setShowBanner(false)} 
              className="text-white ml-4 focus:outline-none"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {!isOffline && pendingItems > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={triggerSync}
            disabled={syncInProgress || isOffline}
            size="sm"
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className={`h-4 w-4 ${syncInProgress ? 'animate-spin' : ''}`} />
            {syncInProgress 
              ? 'Syncing...' 
              : `Sync ${pendingItems} offline ${pendingItems === 1 ? 'bet' : 'bets'}`}
          </Button>
        </div>
      )}
    </>
  );
}