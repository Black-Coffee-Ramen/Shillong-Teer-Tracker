import { useState, useEffect } from "react";
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import * as syncService from "@/services/syncService";
import * as localDB from "@/services/localDatabase";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load last sync time
    const getLastSync = async () => {
      try {
        const session = await localDB.getSession();
        if (session) {
          setLastSyncTime(session.lastSync);
        }
      } catch (error) {
        console.error("Error getting last sync time:", error);
      }
    };

    getLastSync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // If not offline, don't show anything
  if (!isOffline) {
    return null;
  }

  // Format last sync time
  const formattedLastSync = lastSyncTime 
    ? format(lastSyncTime, "MMM d, yyyy h:mm a")
    : "Never";

  // Handle manual sync attempt
  const handleSync = async () => {
    if (navigator.onLine) {
      setIsSyncing(true);
      try {
        await syncService.attemptSync();
        // Refresh last sync time
        const session = await localDB.getSession();
        if (session) {
          setLastSyncTime(session.lastSync);
        }
        setIsOffline(false);
      } catch (error) {
        console.error("Manual sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 backdrop-blur-md bg-background/80 border border-amber-500/30 rounded-lg shadow-lg overflow-hidden mb-2">
      <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-0.5">
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent h-1"></div>
      </div>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-amber-500/20 p-1.5 rounded-full mr-3">
            <WifiOff className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="font-medium text-sm text-foreground">Offline Mode</div>
            <div className="text-xs text-muted-foreground">Last synced: {formattedLastSync}</div>
          </div>
        </div>
        {navigator.onLine && (
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-sm hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Wifi className="h-3 w-3 mr-1.5" />
                Reconnect
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}