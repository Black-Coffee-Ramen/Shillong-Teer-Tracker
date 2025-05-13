import { Bet, Result, Transaction, User } from "@shared/schema";

// Define database constants
const DB_NAME = "shillongTeerDB";
const DB_VERSION = 1;

// Define store (table) names
export const STORES = {
  USERS: "users",
  BETS: "bets",
  RESULTS: "results",
  TRANSACTIONS: "transactions",
  SESSION: "session"
};

// Define types for our local data
export interface LocalUser {
  id: number;
  username: string;
  email: string | null;
  name: string | null;
  balance: number;
  isLoggedIn: boolean;
}

export interface LocalSession {
  id: string;
  userId: number;
  lastSync: Date;
}

// Initialize the database
export async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Error opening local database:", event);
      reject("Failed to open local database");
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log("Local database opened successfully");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const userStore = db.createObjectStore(STORES.USERS, { keyPath: "id" });
        userStore.createIndex("username", "username", { unique: true });
        userStore.createIndex("email", "email", { unique: true });
      }
      
      if (!db.objectStoreNames.contains(STORES.BETS)) {
        const betStore = db.createObjectStore(STORES.BETS, { keyPath: "id" });
        betStore.createIndex("userId", "userId", { unique: false });
        betStore.createIndex("date", "date", { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.RESULTS)) {
        const resultStore = db.createObjectStore(STORES.RESULTS, { keyPath: "id" });
        resultStore.createIndex("date", "date", { unique: true });
      }
      
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: "id" });
        transactionStore.createIndex("userId", "userId", { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.SESSION)) {
        db.createObjectStore(STORES.SESSION, { keyPath: "id" });
      }
      
      console.log("Database schema created/updated");
    };
  });
}

// Generic function to save an item to a store
export async function saveToStore<T>(
  storeName: string, 
  item: T
): Promise<T> {
  const db = await initializeDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => {
      resolve(item);
    };
    
    request.onerror = (event) => {
      console.error(`Error saving to ${storeName}:`, event);
      reject(`Failed to save item to ${storeName}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Generic function to get all items from a store
export async function getAllFromStore<T>(
  storeName: string
): Promise<T[]> {
  const db = await initializeDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      console.error(`Error getting items from ${storeName}:`, event);
      reject(`Failed to get items from ${storeName}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Generic function to get an item by ID
export async function getItemById<T>(
  storeName: string,
  id: number | string
): Promise<T | null> {
  const db = await initializeDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = (event) => {
      console.error(`Error getting item from ${storeName}:`, event);
      reject(`Failed to get item from ${storeName}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Generic function to delete an item
export async function deleteFromStore(
  storeName: string,
  id: number | string
): Promise<boolean> {
  const db = await initializeDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = (event) => {
      console.error(`Error deleting from ${storeName}:`, event);
      reject(`Failed to delete item from ${storeName}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Function to get items by index
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  const db = await initializeDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      console.error(`Error getting items by index from ${storeName}:`, event);
      reject(`Failed to get items by index from ${storeName}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Clear a store
export async function clearStore(storeName: string): Promise<boolean> {
  const db = await initializeDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = (event) => {
      console.error(`Error clearing store ${storeName}:`, event);
      reject(`Failed to clear store ${storeName}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// User-specific functions
export async function saveCurrentUser(user: LocalUser): Promise<LocalUser> {
  return saveToStore<LocalUser>(STORES.USERS, { ...user, isLoggedIn: true });
}

export async function getCurrentUser(): Promise<LocalUser | null> {
  const users = await getAllFromStore<LocalUser>(STORES.USERS);
  return users.find(user => user.isLoggedIn) || null;
}

export async function logoutCurrentUser(): Promise<void> {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    await saveToStore<LocalUser>(STORES.USERS, { ...currentUser, isLoggedIn: false });
  }
}

// Bet-specific functions
export async function getUserBets(userId: number): Promise<Bet[]> {
  return getByIndex<Bet>(STORES.BETS, "userId", userId);
}

// Result-specific functions
export async function getResultByDate(date: Date): Promise<Result | null> {
  const results = await getByIndex<Result>(STORES.RESULTS, "date", date);
  return results.length > 0 ? results[0] : null;
}

// Transaction-specific functions
export async function getUserTransactions(userId: number): Promise<Transaction[]> {
  return getByIndex<Transaction>(STORES.TRANSACTIONS, "userId", userId);
}

// Session management
export async function saveSession(session: LocalSession): Promise<LocalSession> {
  return saveToStore<LocalSession>(STORES.SESSION, session);
}

export async function getSession(): Promise<LocalSession | null> {
  const sessions = await getAllFromStore<LocalSession>(STORES.SESSION);
  return sessions.length > 0 ? sessions[0] : null;
}

export async function clearSession(): Promise<boolean> {
  return clearStore(STORES.SESSION);
}