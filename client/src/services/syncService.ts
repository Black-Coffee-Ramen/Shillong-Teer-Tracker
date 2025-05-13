import { Bet, Result, Transaction } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import * as localDB from "./localDatabase";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Define offline queue types
export interface QueueItem {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  createdAt: Date;
  processed: boolean;
}

const QUEUE_STORE = "sync_queue";

// Function to check online status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Initialize the sync service
export async function initializeSyncService(): Promise<void> {
  // Initialize the IndexedDB database
  await localDB.initializeDB();
  
  // Set up online/offline event listeners
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  
  // Attempt to sync if we're online
  if (isOnline()) {
    await attemptSync();
  }
}

// Handler for coming online
async function handleOnline(): Promise<void> {
  console.log("Device is now online. Attempting to sync data...");
  await attemptSync();
}

// Handler for going offline
function handleOffline(): void {
  console.log("Device is now offline. Changes will be queued for later sync.");
}

// Function to add an item to the sync queue
export async function addToSyncQueue(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: any
): Promise<QueueItem> {
  const queueItem: QueueItem = {
    id: uuidv4(),
    endpoint,
    method,
    data,
    createdAt: new Date(),
    processed: false
  };
  
  try {
    await localDB.saveToStore(QUEUE_STORE, queueItem);
    return queueItem;
  } catch (error) {
    console.error("Failed to add item to sync queue:", error);
    throw error;
  }
}

// Function to process the sync queue
async function processQueue(): Promise<{ success: number; failed: number }> {
  const queue = await localDB.getAllFromStore<QueueItem>(QUEUE_STORE);
  const unprocessedItems = queue.filter(item => !item.processed);
  
  let success = 0;
  let failed = 0;
  
  for (const item of unprocessedItems) {
    try {
      await apiRequest(
        item.method,
        item.endpoint,
        item.method !== "GET" ? item.data : undefined
      );
      
      // Mark as processed
      await localDB.saveToStore(QUEUE_STORE, { ...item, processed: true });
      success++;
      
      // Invalidate related queries
      if (item.endpoint.includes("/bets")) {
        queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      } else if (item.endpoint.includes("/results")) {
        queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      } else if (item.endpoint.includes("/transactions")) {
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      }
    } catch (error) {
      console.error(`Failed to process queue item ${item.id}:`, error);
      failed++;
    }
  }
  
  return { success, failed };
}

// Function to attempt synchronization with the server
export async function attemptSync(): Promise<boolean> {
  if (!isOnline()) {
    console.log("Cannot sync: Device is offline");
    return false;
  }
  
  try {
    // First, process any queued requests
    const queueResult = await processQueue();
    console.log(`Sync queue processed: ${queueResult.success} succeeded, ${queueResult.failed} failed`);
    
    // Then, sync data from server
    await syncUserData();
    await syncBets();
    await syncResults();
    await syncTransactions();
    
    // Update last sync time
    const session = await localDB.getSession();
    if (session) {
      await localDB.saveSession({
        ...session,
        lastSync: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Sync failed:", error);
    return false;
  }
}

// Sync user data from server
async function syncUserData(): Promise<void> {
  try {
    const currentUser = await localDB.getCurrentUser();
    if (!currentUser) return;
    
    const userData = await apiRequest(
      "GET",
      "/api/user"
    );
    
    if (userData) {
      await localDB.saveCurrentUser({
        ...userData,
        isLoggedIn: true
      });
    }
  } catch (error) {
    console.error("Failed to sync user data:", error);
    // Don't throw, continue with other syncs
  }
}

// Sync bets from server
async function syncBets(): Promise<void> {
  try {
    const currentUser = await localDB.getCurrentUser();
    if (!currentUser) return;
    
    const bets = await apiRequest<Bet[]>(
      "GET",
      "/api/bets"
    );
    
    if (bets && Array.isArray(bets)) {
      // Clear existing bets first
      await localDB.clearStore(localDB.STORES.BETS);
      
      // Save new bets
      for (const bet of bets) {
        await localDB.saveToStore(localDB.STORES.BETS, bet);
      }
    }
  } catch (error) {
    console.error("Failed to sync bets:", error);
  }
}

// Sync results from server
async function syncResults(): Promise<void> {
  try {
    const results = await apiRequest<Result[]>(
      "GET",
      "/api/results"
    );
    
    if (results && Array.isArray(results)) {
      // Clear existing results first
      await localDB.clearStore(localDB.STORES.RESULTS);
      
      // Save new results
      for (const result of results) {
        await localDB.saveToStore(localDB.STORES.RESULTS, result);
      }
    }
  } catch (error) {
    console.error("Failed to sync results:", error);
  }
}

// Sync transactions from server
async function syncTransactions(): Promise<void> {
  try {
    const currentUser = await localDB.getCurrentUser();
    if (!currentUser) return;
    
    const transactions = await apiRequest<Transaction[]>(
      "GET",
      "/api/transactions"
    );
    
    if (transactions && Array.isArray(transactions)) {
      // Clear existing transactions first
      await localDB.clearStore(localDB.STORES.TRANSACTIONS);
      
      // Save new transactions
      for (const transaction of transactions) {
        await localDB.saveToStore(localDB.STORES.TRANSACTIONS, transaction);
      }
    }
  } catch (error) {
    console.error("Failed to sync transactions:", error);
  }
}

// Function to place a bet offline
export async function placeOfflineBet(bet: Omit<Bet, "id">): Promise<Bet> {
  try {
    // First try to submit online if possible
    if (isOnline()) {
      return await apiRequest(
        "POST",
        "/api/bets",
        bet
      );
    }
    
    // If offline, queue for later and store locally
    const offlineBet: Bet = {
      ...bet,
      id: Math.floor(Math.random() * -1000000), // Temporary negative ID for offline bets
      date: new Date(),
      isWin: null,
      winAmount: null
    };
    
    // Add to sync queue
    await addToSyncQueue("/api/bets", "POST", bet);
    
    // Store locally
    await localDB.saveToStore(localDB.STORES.BETS, offlineBet);
    
    return offlineBet;
  } catch (error) {
    console.error("Failed to place offline bet:", error);
    throw error;
  }
}

// Setup the sync service when this module is imported
initializeSyncService().catch(error => {
  console.error("Failed to initialize sync service:", error);
});