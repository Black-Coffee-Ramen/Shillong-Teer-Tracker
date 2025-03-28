import { users, type User, type InsertUser, bets, type Bet, type InsertBet, results, type Result, type InsertResult, transactions, type Transaction, type InsertTransaction } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  
  placeBet(bet: InsertBet): Promise<Bet>;
  getUserBets(userId: number): Promise<Bet[]>;
  
  getResults(date?: Date): Promise<Result[]>;
  getResultByDate(date: Date): Promise<Result | undefined>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, updates: Partial<InsertResult>): Promise<Result | undefined>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  sessionStore: any; // Use any to fix type issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bets: Map<number, Bet>;
  private results: Map<number, Result>;
  private transactions: Map<number, Transaction>;
  sessionStore: any; // Use any to fix type issues
  
  currentUserId: number;
  currentBetId: number;
  currentResultId: number;
  currentTransactionId: number;

  constructor() {
    this.users = new Map();
    this.bets = new Map();
    this.results = new Map();
    this.transactions = new Map();
    
    this.currentUserId = 1;
    this.currentBetId = 1;
    this.currentResultId = 1;
    this.currentTransactionId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Add some initial results for demo purposes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Initialize with ID 1 for yesterday
    this.results.set(1, {
      id: 1,
      date: yesterday,
      round1: 42,
      round2: 87
    });
    this.currentResultId++;
    
    // Initialize with ID 2 for today with the correct values
    this.results.set(2, {
      id: 2,
      date: today,
      round1: 86,
      round2: 25
    });
    this.currentResultId++;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      balance: 0,
      name: insertUser.name || null,
      email: insertUser.email || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      balance: user.balance + amount
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async placeBet(bet: InsertBet): Promise<Bet> {
    const id = this.currentBetId++;
    const newBet: Bet = {
      ...bet,
      id,
      date: new Date(),
      isWin: false,
      winAmount: 0
    };
    
    this.bets.set(id, newBet);
    return newBet;
  }
  
  async getUserBets(userId: number): Promise<Bet[]> {
    return Array.from(this.bets.values())
      .filter(bet => bet.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getResults(date?: Date): Promise<Result[]> {
    const results = Array.from(this.results.values());
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return results.filter(result => {
        const resultDate = new Date(result.date);
        resultDate.setHours(0, 0, 0, 0);
        return resultDate.getTime() === targetDate.getTime();
      });
    }
    
    return results.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getResultByDate(date: Date): Promise<Result | undefined> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return Array.from(this.results.values()).find(result => {
      const resultDate = new Date(result.date);
      resultDate.setHours(0, 0, 0, 0);
      return resultDate.getTime() === targetDate.getTime();
    });
  }
  
  async createResult(result: InsertResult): Promise<Result> {
    const id = this.currentResultId++;
    const newResult: Result = { 
      ...result, 
      id, 
      date: result.date || new Date(),
      round1: result.round1 ?? null,
      round2: result.round2 ?? null 
    };
    
    this.results.set(id, newResult);
    return newResult;
  }
  
  async updateResult(id: number, updates: Partial<InsertResult>): Promise<Result | undefined> {
    const result = this.results.get(id);
    if (!result) return undefined;
    
    const updatedResult = { ...result, ...updates };
    this.results.set(id, updatedResult);
    
    return updatedResult;
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction: Transaction = {
      ...transaction,
      id,
      date: new Date(),
      description: transaction.description || null
    };
    
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

export const storage = new MemStorage();