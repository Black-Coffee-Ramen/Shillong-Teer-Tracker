import { users, type User, type InsertUser, bets, type Bet, type InsertBet, results, type Result, type InsertResult, transactions, type Transaction, type InsertTransaction } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { storage as memStorage } from "./storage";

// Determine if we're using a real database or in-memory storage
const useRealDatabase = !!pool && !!db;

// Create appropriate session store
const MemoryStore = createMemoryStore(session);
const sessionStore = useRealDatabase 
  ? new (connectPg(session))({ pool: pool as any, tableName: 'sessions' })
  : new MemoryStore({ checkPeriod: 86400000 });

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  
  placeBet(bet: InsertBet): Promise<Bet>;
  getUserBets(userId: number): Promise<Bet[]>;
  getBetsByDate(date: Date, round?: number): Promise<Bet[]>;
  updateBet(id: number, updates: Partial<Bet>): Promise<Bet | undefined>;
  
  getResults(date?: Date): Promise<Result[]>;
  getResultByDate(date: Date): Promise<Result | undefined>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, updates: Partial<InsertResult>): Promise<Result | undefined>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  exportBets(startDate?: Date, endDate?: Date): Promise<Bet[]>;
  
  sessionStore: any; // Use any to fix type issues
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Use the session store created above based on database availability
    this.sessionStore = sessionStore;
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      if (db) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in getUser, using memStorage fallback");
      return memStorage.getUser(id);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (db) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username));
        return user;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in getUserByUsername, using memStorage fallback");
      return memStorage.getUserByUsername(username);
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      if (db) {
        const [newUser] = await db.insert(users).values(user).returning();
        return newUser;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in createUser, using memStorage fallback");
      return memStorage.createUser(user);
    }
  }

  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    try {
      // First get the user with our already fixed getUser method (which has fallback)
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      if (db) {
        const [updatedUser] = await db
          .update(users)
          .set({ balance: user.balance + amount })
          .where(eq(users.id, userId))
          .returning();
          
        return updatedUser;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in updateUserBalance, using memStorage fallback");
      return memStorage.updateUserBalance(userId, amount);
    }
  }

  async placeBet(bet: InsertBet): Promise<Bet> {
    try {
      if (db) {
        const [newBet] = await db.insert(bets).values(bet).returning();
        return newBet;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in placeBet, using memStorage fallback");
      return memStorage.placeBet(bet);
    }
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    try {
      if (db) {
        return db
          .select()
          .from(bets)
          .where(eq(bets.userId, userId))
          .orderBy(desc(bets.date));
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in getUserBets, using memStorage fallback");
      return memStorage.getUserBets(userId);
    }
  }

  async getBetsByDate(date: Date, round?: number): Promise<Bet[]> {
    try {
      if (db) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        if (round !== undefined) {
          return db
            .select()
            .from(bets)
            .where(
              and(
                gte(bets.date, startDate),
                lte(bets.date, endDate),
                eq(bets.round, round)
              )
            )
            .orderBy(desc(bets.date));
        }
        
        return db
          .select()
          .from(bets)
          .where(
            and(
              gte(bets.date, startDate),
              lte(bets.date, endDate)
            )
          )
          .orderBy(desc(bets.date));
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in getBetsByDate, using memStorage fallback");
      return memStorage.getBetsByDate(date, round);
    }
  }

  async updateBet(id: number, updates: Partial<Bet>): Promise<Bet | undefined> {
    try {
      if (db) {
        const [updatedBet] = await db
          .update(bets)
          .set(updates)
          .where(eq(bets.id, id))
          .returning();
        
        return updatedBet;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in updateBet, using memStorage fallback");
      return memStorage.updateBet(id, updates);
    }
  }

  async getResults(date?: Date): Promise<Result[]> {
    try {
      if (db) {
        if (date) {
          const startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
          
          return db
            .select()
            .from(results)
            .where(
              and(
                gte(results.date, startDate),
                lte(results.date, endDate)
              )
            )
            .orderBy(desc(results.date));
        }
        
        return db
          .select()
          .from(results)
          .orderBy(desc(results.date));
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in getResults, using memStorage fallback");
      return memStorage.getResults(date);
    }
  }

  async getResultByDate(date: Date): Promise<Result | undefined> {
    try {
      if (db) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const [result] = await db
          .select()
          .from(results)
          .where(
            and(
              gte(results.date, startDate),
              lte(results.date, endDate)
            )
          );
        
        return result;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in getResultByDate, using memStorage fallback");
      return memStorage.getResultByDate(date);
    }
  }


  async createResult(result: InsertResult): Promise<Result> {
    try {
      if (db) {
        const [newResult] = await db.insert(results).values(result).returning();
        return newResult;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in createResult, using memStorage fallback");
      return memStorage.createResult(result);
    }
  }




  async updateResult(id: number, updates: Partial<InsertResult>): Promise<Result | undefined> {
    try {
      if (db) {
        const [updatedResult] = await db
          .update(results)
          .set(updates)
          .where(eq(results.id, id))
          .returning();
        
        return updatedResult;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in updateResult, using memStorage fallback");
      return memStorage.updateResult(id, updates);
    }
  }
  
  async deleteResult(id: number): Promise<boolean> {
    try {
      if (db) {
        const deleted = await db
          .delete(results)
          .where(eq(results.id, id))
          .returning({ id: results.id });
        
        return deleted.length > 0;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in deleteResult, using memStorage fallback");
      return memStorage.deleteResult ? memStorage.deleteResult(id) : false;
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      // Ensure metadata is in the right format
      const transactionToInsert = { ...transaction };
      
      // Convert metadata to a proper object if it's a string
      if (typeof transactionToInsert.metadata === 'string') {
        try {
          transactionToInsert.metadata = JSON.parse(transactionToInsert.metadata);
        } catch (error) {
          // If parsing fails, create an empty object
          transactionToInsert.metadata = {};
        }
      }
      
      // If metadata is null or undefined, set an empty object
      if (!transactionToInsert.metadata) {
        transactionToInsert.metadata = {};
      }
      
      if (db) {
        const [newTransaction] = await db
          .insert(transactions)
          .values(transactionToInsert)
          .returning();
        
        return newTransaction;
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in createTransaction, using memStorage fallback");
      return memStorage.createTransaction(transaction);
    }
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    try {
      if (db) {
        return db
          .select()
          .from(transactions)
          .where(eq(transactions.userId, userId))
          .orderBy(desc(transactions.date));
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in getUserTransactions, using memStorage fallback");
      return memStorage.getUserTransactions(userId);
    }
  }

  async exportBets(startDate?: Date, endDate?: Date): Promise<Bet[]> {
    try {
      if (db) {
        // If no dates provided, export all bets
        if (!startDate && !endDate) {
          return db
            .select()
            .from(bets)
            .orderBy(desc(bets.date));
        }
        
        // If only start date is provided
        if (startDate && !endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          
          return db
            .select()
            .from(bets)
            .where(gte(bets.date, start))
            .orderBy(desc(bets.date));
        }
        
        // If only end date is provided
        if (!startDate && endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          return db
            .select()
            .from(bets)
            .where(lte(bets.date, end))
            .orderBy(desc(bets.date));
        }
        
        // If both dates are provided
        const start = new Date(startDate!);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate!);
        end.setHours(23, 59, 59, 999);
        
        return db
          .select()
          .from(bets)
          .where(
            and(
              gte(bets.date, start),
              lte(bets.date, end)
            )
          )
          .orderBy(desc(bets.date));
      } else {
        throw new Error("Database not available");
      }
    } catch (error) {
      console.log("Database error in exportBets, using memStorage fallback");
      return memStorage.exportBets(startDate, endDate);
    }
  }
}

// Try to use the database storage, but fall back to in-memory if there's an error
let storage;
try {
  if (useRealDatabase && db) {
    storage = new DatabaseStorage();
    console.log("Using DATABASE storage implementation");
  } else {
    throw new Error("Database not available");
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("Database connection issue:", errorMessage);
  console.log("Falling back to IN-MEMORY storage implementation");
  storage = memStorage;
}

export { storage };