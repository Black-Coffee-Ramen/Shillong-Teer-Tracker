import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import * as localDB from "@/services/localDatabase";
import * as syncService from "@/services/syncService";
import { Result, Bet, Transaction } from "@shared/schema";

/**
 * Hook to fetch data with offline support
 * @param queryKey - The query key for TanStack Query
 * @param storeName - The local database store name
 * @param filterFn - Optional function to filter local data
 */
export function useOfflineData<T>(
  queryKey: string,
  storeName: string,
  filterFn?: (item: T) => boolean
): {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  lastSyncTime: Date | null;
} {
  const [localData, setLocalData] = useState<T[] | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  // Regular online query
  const query = useQuery<T[]>({
    queryKey: [queryKey],
  });

  // Check if we're offline
  const isOffline = !syncService.isOnline();

  // Load local data
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        setIsLocalLoading(true);
        
        // Get session for last sync time
        const session = await localDB.getSession();
        if (session) {
          setLastSyncTime(session.lastSync);
        }
        
        // Get local data
        let items = await localDB.getAllFromStore<T>(storeName);
        
        // Apply filter if provided
        if (filterFn && items) {
          items = items.filter(filterFn);
        }
        
        setLocalData(items);
        setLocalError(null);
      } catch (error) {
        console.error(`Error loading local ${storeName} data:`, error);
        setLocalError(error as Error);
        setLocalData([]);
      } finally {
        setIsLocalLoading(false);
      }
    };
    
    loadLocalData();
  }, [storeName, filterFn]);

  // If online data is loaded, update local storage
  useEffect(() => {
    const updateLocalData = async () => {
      if (query.data && Array.isArray(query.data) && !isOffline) {
        try {
          // Clear existing data
          await localDB.clearStore(storeName);
          
          // Save new data
          for (const item of query.data) {
            await localDB.saveToStore(storeName, item);
          }
          
          // Update session with new sync time
          const session = await localDB.getSession();
          const now = new Date();
          
          if (session) {
            await localDB.saveSession({
              ...session,
              lastSync: now
            });
          } else {
            await localDB.saveSession({
              id: "main-session",
              userId: -1, // Will be updated when user logs in
              lastSync: now
            });
          }
          
          setLastSyncTime(now);
        } catch (error) {
          console.error(`Error saving ${storeName} to local database:`, error);
        }
      }
    };
    
    updateLocalData();
  }, [query.data, storeName, isOffline]);

  // Return either online or offline data depending on network status
  return {
    data: isOffline ? localData : (query.data || localData),
    isLoading: isOffline ? isLocalLoading : query.isLoading,
    error: isOffline ? localError : query.error,
    isOffline,
    lastSyncTime
  };
}

// Specialized hooks for common data types

export function useOfflineResults(): {
  results: Result[] | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  lastSyncTime: Date | null;
} {
  const { data, isLoading, error, isOffline, lastSyncTime } = useOfflineData<Result>(
    "/api/results",
    localDB.STORES.RESULTS
  );
  
  return {
    results: data,
    isLoading,
    error,
    isOffline,
    lastSyncTime
  };
}

export function useOfflineBets(userId?: number): {
  bets: Bet[] | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  lastSyncTime: Date | null;
} {
  const { data, isLoading, error, isOffline, lastSyncTime } = useOfflineData<Bet>(
    "/api/bets",
    localDB.STORES.BETS,
    userId ? (bet: Bet) => bet.userId === userId : undefined
  );
  
  return {
    bets: data,
    isLoading,
    error,
    isOffline,
    lastSyncTime
  };
}

export function useOfflineTransactions(userId?: number): {
  transactions: Transaction[] | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  lastSyncTime: Date | null;
} {
  const { data, isLoading, error, isOffline, lastSyncTime } = useOfflineData<Transaction>(
    "/api/transactions",
    localDB.STORES.TRANSACTIONS,
    userId ? (transaction: Transaction) => transaction.userId === userId : undefined
  );
  
  return {
    transactions: data,
    isLoading,
    error,
    isOffline,
    lastSyncTime
  };
}