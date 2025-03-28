import { useEffect, useState } from 'react';

// Define the database name and version
const DB_NAME = 'shillong-teer-app';
const DB_VERSION = 1;

interface UseOfflineDBResult {
  db: IDBDatabase | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to access IndexedDB for offline storage
 */
export function useOfflineDB(): UseOfflineDBResult {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle database creation/upgrade
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('offline-bets')) {
        db.createObjectStore('offline-bets', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offline-results')) {
        db.createObjectStore('offline-results', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('user-cache')) {
        db.createObjectStore('user-cache', { keyPath: 'id' });
      }
    };

    // Handle successful database open
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      setDb(db);
      setIsLoading(false);
    };

    // Handle errors
    request.onerror = (event) => {
      setError(new Error(`IndexedDB error: ${(event.target as IDBOpenDBRequest).error}`));
      setIsLoading(false);
    };

    // Clean up function
    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  return { db, isLoading, error };
}

/**
 * Store an item in IndexedDB
 */
export async function storeOfflineItem<T>(
  db: IDBDatabase, 
  storeName: string, 
  item: T
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve items from IndexedDB
 */
export async function getOfflineItems<T>(
  db: IDBDatabase, 
  storeName: string
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an item from IndexedDB
 */
export async function deleteOfflineItem(
  db: IDBDatabase, 
  storeName: string, 
  id: string | number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items from a store
 */
export async function clearOfflineStore(
  db: IDBDatabase, 
  storeName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}