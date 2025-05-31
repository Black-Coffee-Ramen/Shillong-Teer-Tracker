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
  getBetsByDate(date: Date, round?: number): Promise<Bet[]>;
  updateBet(id: number, updates: Partial<Bet>): Promise<Bet | undefined>;
  
  getResults(date?: Date): Promise<Result[]>;
  getResultByDate(date: Date): Promise<Result | undefined>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, updates: Partial<InsertResult>): Promise<Result | undefined>;
  deleteResult(id: number): Promise<boolean>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  exportBets(startDate?: Date, endDate?: Date): Promise<Bet[]>;
  
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
    
    // Create an admin user for testing - using scrypt hashed passwords
    this.users.set(1, {
      id: 1,
      username: "admin",
      password: "c6ba91b90d922e159893f46c387e5dc49e8a0b2aec2230b9755e2d5ac72fd5509c89c6b33f533c02f8b65b7a21c7ac3b4b0b4e7b6a7e8f1d2c8f9e0a4b5f3e8.1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p", // scrypt hashed "password123"
      balance: 10000,
      name: "Admin User",
      email: "admin@example.com",
      phone: null,
      isVerified: true
    });
    this.currentUserId++;
    
    // Add a regular user
    this.users.set(2, {
      id: 2,
      username: "user",
      password: "c6ba91b90d922e159893f46c387e5dc49e8a0b2aec2230b9755e2d5ac72fd5509c89c6b33f533c02f8b65b7a21c7ac3b4b0b4e7b6a7e8f1d2c8f9e0a4b5f3e8.1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p", // scrypt hashed "password123"
      balance: 5000,
      name: "Regular User",
      email: "user@example.com",
      phone: null,
      isVerified: true
    });
    this.currentUserId++;
    
    // Add some test bets for export functionality
    // May 12, 2025 bets
    const may12 = new Date('2025-05-12T10:00:00Z');
    this.bets.set(1, {
      id: 1,
      userId: 2,
      number: 42,
      amount: 100,
      round: 1,
      date: may12,
      isWin: true,
      winAmount: 800
    });
    this.currentBetId++;
    
    this.bets.set(2, {
      id: 2,
      userId: 2,
      number: 17,
      amount: 200,
      round: 2,
      date: may12,
      isWin: false,
      winAmount: 0
    });
    this.currentBetId++;
    
    // May 13, 2025 bets
    const may13 = new Date('2025-05-13T09:30:00Z');
    this.bets.set(3, {
      id: 3,
      userId: 2,
      number: 55,
      amount: 150,
      round: 1,
      date: may13,
      isWin: false,
      winAmount: 0
    });
    this.currentBetId++;
    
    this.bets.set(4, {
      id: 4,
      userId: 1, // admin user
      number: 78,
      amount: 500,
      round: 2,
      date: may13,
      isWin: true,
      winAmount: 4000
    });
    this.currentBetId++;
    
    // Full historical results data as of March 30, 2025
    const resultsData = [
      { date: "2025-03-29", round1: 61, round2: 51 },
      { date: "2025-03-28", round1: 86, round2: 25 },
      { date: "2025-03-27", round1: 0, round2: 35 },
      { date: "2025-03-26", round1: 14, round2: 89 },
      { date: "2025-03-25", round1: 78, round2: 72 },
      { date: "2025-03-24", round1: 74, round2: 29 },
      // Sunday - No results for March 23, 2025
      { date: "2025-03-22", round1: 52, round2: 61 },
      { date: "2025-03-21", round1: 70, round2: 98 },
      { date: "2025-03-20", round1: 92, round2: 66 },
      { date: "2025-03-19", round1: 91, round2: 78 },
      { date: "2025-03-18", round1: 0, round2: 81 },
      { date: "2025-03-17", round1: 44, round2: 46 },
      // Sunday - No results for March 16, 2025
      { date: "2025-03-15", round1: 30, round2: 70 },
      { date: "2025-03-14", round1: 67, round2: 44 },
      { date: "2025-03-13", round1: 66, round2: 88 },
      { date: "2025-03-12", round1: 26, round2: 71 },
      { date: "2025-03-11", round1: 47, round2: 35 },
      { date: "2025-03-10", round1: 3, round2: 8 },
      // Sunday - No results for March 9, 2025
      { date: "2025-03-08", round1: 44, round2: 63 },
      { date: "2025-03-07", round1: 83, round2: 10 },
      { date: "2025-03-06", round1: 24, round2: 34 },
      { date: "2025-03-05", round1: 23, round2: 10 },
      { date: "2025-03-04", round1: 82, round2: 76 },
      { date: "2025-03-03", round1: 60, round2: 46 },
      // Sunday - No results for March 2, 2025
      { date: "2025-03-01", round1: 33, round2: 46 },
      { date: "2025-02-28", round1: 66, round2: 6 },
      { date: "2025-02-27", round1: 98, round2: 76 },
      { date: "2025-02-26", round1: 2, round2: 5 },
      { date: "2025-02-25", round1: 35, round2: 49 },
      { date: "2025-02-24", round1: 81, round2: 18 },
      // Sunday - No results for February 23, 2025
      { date: "2025-02-22", round1: 5, round2: 17 },
      { date: "2025-02-21", round1: 84, round2: 57 },
      { date: "2025-02-20", round1: 95, round2: 28 },
      { date: "2025-02-19", round1: 36, round2: 26 },
      { date: "2025-02-18", round1: 43, round2: 85 },
      { date: "2025-02-17", round1: 84, round2: 54 },
      // Sunday - No results for February 16, 2025
      { date: "2025-02-15", round1: 97, round2: 35 },
      { date: "2025-02-14", round1: 77, round2: 97 }
    ];
    
    // Add all results to the map
    resultsData.forEach((result, index) => {
      const dateObj = new Date(result.date);
      dateObj.setHours(0, 0, 0, 0);
      
      this.results.set(index + 1, {
        id: index + 1,
        date: dateObj,
        round1: result.round1,
        round2: result.round2
      });
      this.currentResultId++;
    });
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
      email: insertUser.email || null,
      phone: insertUser.phone || null,
      isVerified: false
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
  
  async getBetsByDate(date: Date, round?: number): Promise<Bet[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return Array.from(this.bets.values())
      .filter(bet => {
        const betDate = new Date(bet.date);
        betDate.setHours(0, 0, 0, 0);
        
        const dateMatches = betDate.getTime() === targetDate.getTime();
        const roundMatches = round ? bet.round === round : true;
        
        return dateMatches && roundMatches;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async updateBet(id: number, updates: Partial<Bet>): Promise<Bet | undefined> {
    const bet = this.bets.get(id);
    if (!bet) return undefined;
    
    const updatedBet = { ...bet, ...updates };
    this.bets.set(id, updatedBet);
    
    return updatedBet;
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
  
  async deleteResult(id: number): Promise<boolean> {
    if (!this.results.has(id)) return false;
    
    return this.results.delete(id);
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction: Transaction = {
      id,
      type: transaction.type,
      amount: transaction.amount,
      userId: transaction.userId,
      date: new Date(),
      description: transaction.description || null,
      status: transaction.status || null,
      razorpayOrderId: transaction.razorpayOrderId || null,
      razorpayPaymentId: transaction.razorpayPaymentId || null,
      razorpaySignature: transaction.razorpaySignature || null,
      metadata: transaction.metadata || {}
    };
    
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async exportBets(startDate?: Date, endDate?: Date): Promise<Bet[]> {
    const bets = Array.from(this.bets.values());
    
    // If no date filters, return all bets
    if (!startDate && !endDate) {
      return bets.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    
    // Format dates for consistent comparison - use YYYY-MM-DD as string for comparison
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    let startDateStr: string | undefined;
    let endDateStr: string | undefined;
    
    if (startDate) {
      startDateStr = formatDateString(startDate);
    }
    
    if (endDate) {
      endDateStr = formatDateString(endDate);
    }
    
    const filteredBets = bets.filter(bet => {
      const betDate = new Date(bet.date);
      const betDateStr = formatDateString(betDate);
      
      // Filter by start date if provided
      if (startDateStr && betDateStr < startDateStr) {
        return false;
      }
      
      // Filter by end date if provided
      if (endDateStr && betDateStr > endDateStr) {
        return false;
      }
      
      return true;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return filteredBets;
  }
}

export const storage = new MemStorage();