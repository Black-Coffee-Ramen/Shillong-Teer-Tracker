import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertBetSchema, insertResultSchema, insertTransactionSchema, Bet } from "@shared/schema";
import crypto from "crypto";
import betRoutes from "./bet-routes";

// Define a type for metadata to resolve TypeScript errors
type MetadataType = {
  [key: string]: any;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Add betting routes
  app.use("/api/betting", betRoutes);
  
  // Handle service worker requests with the correct MIME type
  app.get("/service-worker.js", (_req, res, next) => {
    res.setHeader("Content-Type", "application/javascript");
    next();
  });

  // API Routes
  
  // Admin only - Get all users with details
  app.get("/api/admin/users", async (req, res) => {
    // More detailed logging to diagnose issues
    console.log("==== ADMIN USERS ENDPOINT ====");
    console.log("Request path:", req.path);
    console.log("Request query:", req.query);
    console.log("Auth status:", req.isAuthenticated());
    console.log("User details:", req.user ? 
      `ID: ${req.user.id}, Username: ${req.user.username}` : "Not authenticated");
    console.log("Headers:", req.headers);
    
    res.setHeader('Content-Type', 'application/json');
    
    if (!req.isAuthenticated() || req.user?.username !== "admin") {
      console.log("Authentication failed - not admin");
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      console.log("Authentication successful - fetching users data");
      // Get all users (in a real app, we'd use a database query)
      // For in-memory demo, we'll iterate through potential user IDs
      const users = [];
      
      for (let userId = 1; userId <= 10; userId++) {
        const user = await storage.getUser(userId);
        if (user) {
          console.log(`Found user ID ${userId}: ${user.username}`);
          // Get user's bets and transactions
          const bets = await storage.getUserBets(userId);
          console.log(`  Bets for user ${userId}: ${bets.length}`);
          
          const transactions = await storage.getUserTransactions(userId);
          console.log(`  Transactions for user ${userId}: ${transactions.length}`);
          
          // Don't send password to client
          const { password, ...userWithoutPassword } = user;
          
          users.push({
            ...userWithoutPassword,
            bets,
            transactions
          });
        }
      }
      
      console.log(`Returning ${users.length} users`);
      return res.json(users);
    } catch (error: any) {
      console.error("Error fetching admin user data:", error);
      console.error(error?.stack || "No stack trace available");
      return res.status(500).json({ 
        message: "Error retrieving user data" 
      });
    }
  });
  
  // Process wins for new results
  app.post("/api/process-wins", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.username !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const { resultId } = req.body;
      if (!resultId) {
        return res.status(400).json({ message: "Result ID is required" });
      }
      
      // Get the result
      const results = await storage.getResults();
      const result = results.find(r => r.id === parseInt(resultId));
      
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      // Skip if result doesn't have data
      if (result.round1 === null && result.round2 === null) {
        return res.status(400).json({ message: "Result has no data" });
      }
      
      // Get date of the result for filtering bets
      const resultDate = new Date(result.date);
      resultDate.setHours(0, 0, 0, 0);
      
      // Processed wins to track
      const processedWins = [];
      
      // Get all bets from all users
      // In a real implementation, we'd query just for the specific date
      // but for our in-memory setup we'll fetch all and filter
      const allBets: Bet[] = [];
      
      // Get all bets for all active users (user ID 1 is admin, 2 is user)
      for (let userId = 1; userId <= 5; userId++) {
        const user = await storage.getUser(userId);
        if (user) {
          console.log(`Processing bets for user ${userId}: ${user.username}`);
          const userBets = await storage.getUserBets(userId);
          console.log(`Found ${userBets.length} bets for user ${userId}`);
          allBets.push(...userBets);
        }
      }
      
      console.log(`Total bets to process: ${allBets.length}`);
      console.log(`Result data: Round1=${result.round1}, Round2=${result.round2}`);
      
      // Process round 1 wins if we have a result
      if (result.round1 !== null) {
        console.log(`Processing Round 1 bets for result number ${result.round1}`);
        
        const round1Bets = allBets.filter(bet => {
          const betDate = new Date(bet.date);
          
          // Check if the bet was placed on the same date
          const isSameDate = betDate.toDateString() === resultDate.toDateString();
          
          // Check if bet is for round 1
          const isRound1 = bet.round === 1;
          
          // Check if the bet was placed before the round 1 result time (15:30 IST)
          const betTime = betDate.getHours() * 60 + betDate.getMinutes();
          const round1CutoffTime = 15 * 60 + 30; // 15:30 in minutes
          const isBeforeRound1 = betTime < round1CutoffTime;
          
          // Only consider bets that were placed before the round 1 cutoff time
          const shouldInclude = isSameDate && isRound1 && isBeforeRound1;
          
          console.log(`Bet #${bet.id} - Number: ${bet.number}, Round: ${bet.round}, Date: ${betDate.toISOString()}`);
          console.log(`  - isSameDate: ${isSameDate}, isRound1: ${isRound1}, isBeforeRound1: ${isBeforeRound1}`);
          console.log(`  - INCLUDE IN PROCESSING: ${shouldInclude}`);
          
          return shouldInclude;
        });
        
        console.log(`Found ${round1Bets.length} Round 1 bets to process`);
        
        // Process each bet in round 1
        for (const bet of round1Bets) {
          console.log(`Checking bet #${bet.id} - Number: ${bet.number} against result: ${result.round1}`);
          
          if (bet.number === result.round1 && !bet.isWin) {
            console.log(`WIN MATCH FOUND! Bet #${bet.id} matches Round 1 result: ${result.round1}`);
            
            // Calculate win amount (80x multiplier)
            const winAmount = bet.amount * 80;
            console.log(`Win amount: ${bet.amount} x 80 = ${winAmount}`);
            
            // Mark bet as a win
            await storage.updateBet(bet.id, {
              isWin: true,
              winAmount: winAmount
            });
            
            // Add win amount to user balance
            const user = await storage.getUser(bet.userId);
            if (user) {
              console.log(`Crediting win to user ${user.id} (${user.username})`);
              await storage.updateUserBalance(user.id, winAmount);
              
              // Record transaction
              const transaction = await storage.createTransaction({
                userId: user.id,
                amount: winAmount,
                type: "win",
                description: `Win on number ${bet.number} for Round 1`,
                metadata: {
                  number: bet.number,
                  round: 1
                } as MetadataType
              });
              
              console.log(`Created win transaction #${transaction.id} for user ${user.id}`);
              
              // Show notification for the user
              processedWins.push({
                betId: bet.id,
                userId: bet.userId,
                number: bet.number,
                amount: bet.amount,
                winAmount: winAmount,
                round: 1
              });
            }
          } else {
            console.log(`No match for bet #${bet.id} (${bet.number} ≠ ${result.round1})`);
          }
        }
      }
      
      // Process round 2 wins if we have a result
      if (result.round2 !== null) {
        console.log(`Processing Round 2 bets for result number ${result.round2}`);
        
        const round2Bets = allBets.filter(bet => {
          const betDate = new Date(bet.date);
          
          // Check if the bet was placed on the same date
          const isSameDate = betDate.toDateString() === resultDate.toDateString();
          
          // Check if bet is for round 2
          const isRound2 = bet.round === 2;
          
          // Check if the bet was placed before the round 2 result time (16:30 IST)
          const betTime = betDate.getHours() * 60 + betDate.getMinutes();
          const round2CutoffTime = 16 * 60 + 30; // 16:30 in minutes
          const isBeforeRound2 = betTime < round2CutoffTime;
          
          // Only consider bets that were placed before the round 2 cutoff time
          const shouldInclude = isSameDate && isRound2 && isBeforeRound2;
          
          console.log(`Bet #${bet.id} - Number: ${bet.number}, Round: ${bet.round}, Date: ${betDate.toISOString()}`);
          console.log(`  - isSameDate: ${isSameDate}, isRound2: ${isRound2}, isBeforeRound2: ${isBeforeRound2}`);
          console.log(`  - INCLUDE IN PROCESSING: ${shouldInclude}`);
          
          return shouldInclude;
        });
        
        console.log(`Found ${round2Bets.length} Round 2 bets to process`);
        
        // Process each bet in round 2
        for (const bet of round2Bets) {
          console.log(`Checking bet #${bet.id} - Number: ${bet.number} against result: ${result.round2}`);
          
          if (bet.number === result.round2 && !bet.isWin) {
            console.log(`WIN MATCH FOUND! Bet #${bet.id} matches Round 2 result: ${result.round2}`);
            
            // Calculate win amount (80x multiplier)
            const winAmount = bet.amount * 80;
            console.log(`Win amount: ${bet.amount} x 80 = ${winAmount}`);
            
            // Mark bet as a win
            await storage.updateBet(bet.id, {
              isWin: true,
              winAmount: winAmount
            });
            
            // Add win amount to user balance
            const user = await storage.getUser(bet.userId);
            if (user) {
              console.log(`Crediting win to user ${user.id} (${user.username})`);
              await storage.updateUserBalance(user.id, winAmount);
              
              // Record transaction
              const transaction = await storage.createTransaction({
                userId: user.id,
                amount: winAmount,
                type: "win",
                description: `Win on number ${bet.number} for Round 2`,
                metadata: {
                  number: bet.number,
                  round: 2
                } as MetadataType
              });
              
              console.log(`Created win transaction #${transaction.id} for user ${user.id}`);
              
              // Show notification for the user
              processedWins.push({
                betId: bet.id,
                userId: bet.userId,
                number: bet.number,
                amount: bet.amount,
                winAmount: winAmount,
                round: 2
              });
            }
          } else {
            console.log(`No match for bet #${bet.id} (${bet.number} ≠ ${result.round2})`);
          }
        }
      }
      
      res.json({
        resultId: result.id,
        resultDate: result.date,
        totalWins: processedWins.length,
        winDetails: processedWins
      });
    } catch (error) {
      console.error("Error processing wins:", error);
      res.status(500).json({ message: "Error processing wins" });
    }
  });
  
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
      // Convert string date to Date object before validation
      const data = req.body;
      if (data.date && typeof data.date === 'string') {
        data.date = new Date(data.date);
      }
      
      const resultData = insertResultSchema.parse(data);
      
      // Check if result for this date already exists
      const resultDate = resultData.date || new Date();
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
  
  // Direct update endpoint for results by ID (PUT for full update)
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
  
  // PATCH endpoint for partial updates to results
  app.patch("/api/results/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.username !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Extract only the fields that are present in the request body
      const updates: Partial<typeof req.body> = {};
      if ('round1' in req.body) {
        updates.round1 = req.body.round1 !== null && req.body.round1 !== undefined ? 
          parseInt(req.body.round1) : null;
      }
      
      if ('round2' in req.body) {
        updates.round2 = req.body.round2 !== null && req.body.round2 !== undefined ? 
          parseInt(req.body.round2) : null;
      }
      
      if ('date' in req.body) {
        updates.date = new Date(req.body.date);
      }
      
      const updated = await storage.updateResult(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating result:", error);
      res.status(500).json({ message: "Error updating result" });
    }
  });
  
  // DELETE endpoint for removing results
  app.delete("/api/results/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.username !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteResult(id);
      
      if (!success) {
        return res.status(404).json({ message: "Result not found or could not be deleted" });
      }
      
      res.status(200).json({ message: "Result deleted successfully" });
    } catch (error) {
      console.error("Error deleting result:", error);
      res.status(500).json({ message: "Error deleting result" });
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
        description: `Bet placed on number ${betData.number} for Round ${betData.round}`,
        metadata: {
          number: betData.number,
          round: betData.round
        } as MetadataType
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
  // Create Razorpay Order
  app.post("/api/payment/create-order", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const orderSchema = z.object({
        amount: z.number().min(100),
        currency: z.string().default("INR")
      });
      
      const { amount, currency } = orderSchema.parse(req.body);
      
      // Create unique order ID
      const orderId = `order_${Date.now()}_${req.user.id}`;
      
      // Create transaction record with pending status
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        amount: amount,
        type: "deposit",
        description: "Razorpay deposit (pending)",
        razorpayOrderId: orderId,
        status: "pending"
      });
      
      // Prepare Razorpay order options
      const options = {
        amount: amount * 100, // Razorpay expects amount in smallest currency unit (paise)
        currency,
        receipt: `receipt_${transaction.id}`,
        notes: {
          userId: req.user.id.toString(),
          transactionId: transaction.id.toString()
        }
      };
      
      res.status(200).json({
        id: orderId,
        amount: options.amount,
        currency,
        key: process.env.RAZORPAY_KEY_ID,
        name: "Shillong Teer",
        description: "Add funds to your Shillong Teer wallet",
        prefill: {
          name: req.user.name || req.user.username,
          email: req.user.email
        },
        notes: options.notes
      });
    } catch (error) {
      console.error("Error creating payment order:", error);
      res.status(400).json({ message: "Error creating payment order" });
    }
  });
  
  // Verify payment and update transaction
  app.post("/api/payment/verify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const paymentSchema = z.object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
        transactionId: z.number()
      });
      
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        transactionId
      } = paymentSchema.parse(req.body);
      
      // Find the pending transaction
      const transactions = await storage.getUserTransactions(req.user.id);
      const pendingTransaction = transactions.find(
        t => t.id === transactionId && 
             t.status === "pending" && 
             t.razorpayOrderId === razorpay_order_id
      );
      
      if (!pendingTransaction) {
        return res.status(400).json({ message: "Transaction not found" });
      }
      
      // Verify signature
      const text = razorpay_order_id + "|" + razorpay_payment_id;
      const secret = process.env.RAZORPAY_KEY_SECRET || "";
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(text)
        .digest("hex");
      
      const isValid = generatedSignature === razorpay_signature;
      
      if (!isValid) {
        // Update transaction as failed
        // Create a new transaction with failed status since our storage doesn't support updating
        await storage.createTransaction({
          userId: req.user.id,
          amount: 0,
          type: "deposit",
          description: "Razorpay deposit (failed verification)",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "failed"
        });
        
        return res.status(400).json({ message: "Invalid payment signature" });
      }
      
      // Create a new transaction with completed status
      const completedTransaction = await storage.createTransaction({
        userId: req.user.id,
        amount: pendingTransaction.amount,
        type: "deposit",
        description: "Razorpay deposit (completed)",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "completed"
      });
      
      // Update user balance
      const updatedUser = await storage.updateUserBalance(req.user.id, pendingTransaction.amount);
      if (!updatedUser) {
        return res.status(400).json({ message: "Failed to update balance" });
      }
      
      res.status(200).json({ 
        success: true, 
        transaction: completedTransaction,
        newBalance: updatedUser.balance
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(400).json({ message: "Error verifying payment" });
    }
  });
  
  // Add funds to wallet (direct method without payment gateway for testing)
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
        description: "Wallet deposit (testing)",
        status: "completed"
      });
      
      return res.status(201).json({
        success: true,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description,
          status: transaction.status
        },
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
      
      // Check if user has any win transactions in the last 2 hours
      const userTransactions = await storage.getUserTransactions(req.user.id);
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      const recentWins = userTransactions.filter(
        transaction => transaction.type === "win" && 
        new Date(transaction.date).getTime() > twoHoursAgo.getTime()
      );
      
      if (recentWins.length > 0) {
        return res.status(400).json({ 
          message: "Withdrawals are restricted for 2 hours after winning. Please try again later.",
          restrictedUntil: new Date(Math.max(...recentWins.map(win => new Date(win.date).getTime())) + 2 * 60 * 60 * 1000)
        });
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
