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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const [updatedUser] = await db
      .update(users)
      .set({ balance: user.balance + amount })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async placeBet(bet: InsertBet): Promise<Bet> {
    const [newBet] = await db.insert(bets).values(bet).returning();
    return newBet;
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.date));
  }

  async getBetsByDate(date: Date, round?: number): Promise<Bet[]> {
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
  }

  async updateBet(id: number, updates: Partial<Bet>): Promise<Bet | undefined> {
    const [updatedBet] = await db
      .update(bets)
      .set(updates)
      .where(eq(bets.id, id))
      .returning();
    
    return updatedBet;
  }

  async getResults(date?: Date): Promise<Result[]> {
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
  }

  async getResultByDate(date: Date): Promise<Result | undefined> {
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
  }

  async createResult(result: InsertResult): Promise<Result> {
    const [newResult] = await db.insert(results).values(result).returning();
    return newResult;
  }

  async updateResult(id: number, updates: Partial<InsertResult>): Promise<Result | undefined> {
    const [updatedResult] = await db
      .update(results)
      .set(updates)
      .where(eq(results.id, id))
      .returning();
    
    return updatedResult;
  }
  
  async deleteResult(id: number): Promise<boolean> {
    const deleted = await db
      .delete(results)
      .where(eq(results.id, id))
      .returning({ id: results.id });
    
    return deleted.length > 0;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
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
    
    const [newTransaction] = await db
      .insert(transactions)
      .values(transactionToInsert)
      .returning();
    
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async exportBets(startDate?: Date, endDate?: Date): Promise<Bet[]> {
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