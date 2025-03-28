import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertBetSchema, insertResultSchema, insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API Routes
  
  // Results API
  app.get("/api/results", async (req, res) => {
    try {
      const dateStr = req.query.date as string;
      let date: Date | undefined = undefined;
      
      if (dateStr) {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      const results = await storage.getResults(date);
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Error fetching results" });
    }
  });
  
  app.post("/api/results", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.username !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const resultData = insertResultSchema.parse(req.body);
      
      // Check if result for this date already exists
      // Ensure resultData.date is a valid Date
      const resultDate = resultData.date ? new Date(resultData.date) : new Date();
      const existingResult = await storage.getResultByDate(resultDate);
      
      if (existingResult) {
        // Update existing result
        const updated = await storage.updateResult(existingResult.id, resultData);
        res.json(updated);
      } else {
        // Create new result
        const result = await storage.createResult(resultData);
        res.status(201).json(result);
      }
    } catch (error) {
      console.error("Error creating/updating result:", error);
      res.status(400).json({ message: "Invalid result data" });
    }
  });
  
  // Direct update endpoint for results by ID
  app.put("/api/results/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.username !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const { round1, round2 } = req.body;
      
      const updated = await storage.updateResult(id, { 
        round1: round1 !== undefined ? round1 : null,
        round2: round2 !== undefined ? round2 : null
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating result:", error);
      res.status(500).json({ message: "Error updating result" });
    }
  });
  
  // Bets API
  app.post("/api/bets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Please login to place bets" });
    }
    
    try {
      const betSchema = insertBetSchema.extend({
        number: z.number().min(0).max(99),
        amount: z.number().min(5),
        round: z.number().min(1).max(2)
      });
      
      const betData = betSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if user has enough balance
      const user = await storage.getUser(req.user.id);
      if (!user || user.balance < betData.amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      // Place bet
      const bet = await storage.placeBet(betData);
      
      // Deduct amount from user balance
      await storage.updateUserBalance(user.id, -betData.amount);
      
      // Record transaction
      await storage.createTransaction({
        userId: user.id,
        amount: -betData.amount,
        type: "bet",
        description: `Bet placed on number ${betData.number} for Round ${betData.round}`
      });
      
      res.status(201).json(bet);
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(400).json({ message: "Invalid bet data" });
    }
  });
  
  app.get("/api/bets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const bets = await storage.getUserBets(req.user.id);
      res.json(bets);
    } catch (error) {
      console.error("Error fetching bets:", error);
      res.status(500).json({ message: "Error fetching bets" });
    }
  });
  
  // Wallet & Transactions API
  app.post("/api/transactions/deposit", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const depositSchema = z.object({
        amount: z.number().min(100)
      });
      
      const { amount } = depositSchema.parse(req.body);
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(req.user.id, amount);
      if (!updatedUser) {
        return res.status(400).json({ message: "Failed to update balance" });
      }
      
      // Record transaction
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        amount: amount,
        type: "deposit",
        description: "Wallet deposit"
      });
      
      res.status(201).json({ 
        transaction,
        newBalance: updatedUser.balance
      });
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(400).json({ message: "Invalid deposit data" });
    }
  });
  
  app.post("/api/transactions/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const withdrawSchema = z.object({
        amount: z.number().min(500)
      });
      
      const { amount } = withdrawSchema.parse(req.body);
      
      // Check if user has enough balance
      const user = await storage.getUser(req.user.id);
      if (!user || user.balance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(req.user.id, -amount);
      if (!updatedUser) {
        return res.status(400).json({ message: "Failed to update balance" });
      }
      
      // Record transaction
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        amount: -amount,
        type: "withdraw",
        description: "Wallet withdrawal"
      });
      
      res.status(201).json({ 
        transaction,
        newBalance: updatedUser.balance
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(400).json({ message: "Invalid withdrawal data" });
    }
  });
  
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
