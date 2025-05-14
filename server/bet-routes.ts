import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "./db-storage";
import { insertBetSchema, insertTransactionSchema } from "@shared/schema";

// Define a type for metadata to resolve TypeScript errors
type MetadataType = Record<string, any>;

const router = express.Router();

// Check if betting is currently allowed for a specific round
function isBettingOpen(round: number): { isOpen: boolean; message: string } {
  // Get current server time
  const now = new Date();
  
  // Check if it's Sunday (day of week 0) - no betting on Sundays
  if (now.getDay() === 0) {
    return { 
      isOpen: false, 
      message: "Betting closed for today. Shillong Teer does not operate on Sundays." 
    };
  }
  
  // Set cutoff time based on round
  const cutoffHour = round === 1 ? 15 : 16; // 15:30 for Round 1, 16:30 for Round 2
  const cutoffMinute = 30;
  
  // Create date object for the cutoff time
  const cutoff = new Date(now);
  cutoff.setHours(cutoffHour, cutoffMinute, 0, 0);
  
  // If current time is past the cutoff, betting is closed for this round
  if (now >= cutoff) {
    return { 
      isOpen: false, 
      message: "Betting closed for this round. Please wait for the next round." 
    };
  }
  
  // Betting is open
  return {
    isOpen: true,
    message: "Betting is open"
  };
}

// Test endpoint to debug bet exports
router.get("/debug-export", async (req: Request, res: Response) => {
  try {
    const allBets = await storage.exportBets();
    const startDate = new Date('2025-05-12');
    const endDate = new Date('2025-05-13');
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const filteredBets = await storage.exportBets(startDate, endDate);
    
    res.json({
      allBets,
      filteredBets,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error("Debug export error:", error);
    res.status(500).json({ error: "Error in debug export" });
  }
});

// Get betting status
router.get("/status", (req: Request, res: Response) => {
  const round1Status = isBettingOpen(1);
  const round2Status = isBettingOpen(2);
  
  const now = new Date();
  const today = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  
  res.json({
    currentTime: now.toISOString(),
    today,
    round1: {
      isOpen: round1Status.isOpen,
      message: round1Status.message,
      cutoffTime: "15:30"
    },
    round2: {
      isOpen: round2Status.isOpen,
      message: round2Status.message,
      cutoffTime: "16:30"
    },
    isSunday: now.getDay() === 0
  });
});

// Place a bet
router.post("/place", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in to place a bet" });
  }
  
  try {
    // Enhanced betting validation
    const betSchema = insertBetSchema.extend({
      number: z.number()
        .int()
        .min(0, "Number must be between 0 and 99")
        .max(99, "Number must be between 0 and 99"),
      amount: z.number()
        .int()
        .min(10, "Minimum bet amount is 10")
        .max(10000, "Maximum bet amount is 10000"),
      round: z.number()
        .int()
        .min(1, "Round must be 1 or 2")
        .max(2, "Round must be 1 or 2"),
    });
    
    const betData = betSchema.parse({
      ...req.body,
      userId: req.user.id
    });
    
    // Check if betting is open for this round
    const roundStatus = isBettingOpen(betData.round);
    if (!roundStatus.isOpen) {
      return res.status(403).json({ message: roundStatus.message });
    }
    
    // Get user to check balance
    const user = await storage.getUser(req.user.id);
    if (!user || user.balance < betData.amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    
    // Place the bet and deduct balance
    const bet = await storage.placeBet(betData);
    
    // Update user balance
    await storage.updateUserBalance(user.id, -betData.amount);
    
    // Create transaction record
    await storage.createTransaction({
      userId: user.id,
      amount: -betData.amount,
      type: "bet",
      description: `Bet on number ${betData.number} for Round ${betData.round}`,
      status: "completed",
      metadata: {} // Empty metadata for now to fix TypeScript error
    });
    
    // Format the date the bet is for (today)
    const now = new Date();
    const bettingDateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    res.status(201).json({ 
      ...bet,
      bettingDate: bettingDateStr,
      message: "Bet placed successfully" 
    });
  } catch (error) {
    console.error("Error placing bet:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid bet data", 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: "Error placing bet" });
  }
});

// Get user's betting history
router.get("/history", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "You must be logged in to view bet history" });
  }
  
  try {
    const bets = await storage.getUserBets(req.user.id);
    res.json(bets);
  } catch (error) {
    console.error("Error fetching bet history:", error);
    res.status(500).json({ message: "Error fetching bet history" });
  }
});

// Export bets data (admin only)
router.get("/export", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || req.user?.username !== "admin") {
    return res.status(403).json({ message: "Unauthorized - Admin access required" });
  }
  
  try {
    console.log("Export request received with query params:", req.query);
    
    // Parse date parameters
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;
    
    if (req.query.startDate) {
      // Handle ISO string or other date formats
      const startDateStr = req.query.startDate as string;
      
      // If we receive a YYYY-MM-DD format from client, make sure to parse it correctly
      if (startDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // For YYYY-MM-DD format, use split and make sure month is 0-indexed
        const [year, month, day] = startDateStr.split('-').map(num => parseInt(num, 10));
        startDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript
      } else {
        startDate = new Date(startDateStr);
      }
      
      console.log("Parsed startDate:", startDate, "from string:", startDateStr);
      
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: "Invalid start date format" });
      }
      
      // Ensure startDate is set to beginning of day
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (req.query.endDate) {
      // Handle ISO string or other date formats
      const endDateStr = req.query.endDate as string;
      
      // If we receive a YYYY-MM-DD format from client, make sure to parse it correctly
      if (endDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // For YYYY-MM-DD format, use split and make sure month is 0-indexed
        const [year, month, day] = endDateStr.split('-').map(num => parseInt(num, 10));
        endDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript
      } else {
        endDate = new Date(endDateStr);
      }
      
      console.log("Parsed endDate:", endDate, "from string:", endDateStr);
      
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid end date format" });
      }
      
      // Ensure endDate is set to end of day
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Check all bets in system 
    const allBets = await storage.exportBets(undefined, undefined);
    console.log("Total bets in system:", allBets.length);
    
    if (allBets.length === 0) {
      console.log("No bets found in system. Exporting empty dataset.");
    } else {
      console.log("Available bet dates:");
      const dateMap: Record<string, boolean> = {};
      allBets.forEach(bet => {
        const date = new Date(bet.date);
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        dateMap[dateStr] = true;
      });
      console.log(Object.keys(dateMap));
    }
    
    // Get bets data with date filtering
    const bets = await storage.exportBets(startDate, endDate);
    console.log(`Found ${bets.length} bets matching date range:`, 
      startDate ? startDate.toISOString() : "all-time", 
      "to", 
      endDate ? endDate.toISOString() : "present");
    
    // Determine export format (json or csv)
    const format = (req.query.format as string)?.toLowerCase() || "json";
    
    if (format === "csv") {
      // Generate CSV
      const csvHeader = "ID,User ID,Number,Amount,Round,Date,Is Win,Win Amount\n";
      const csvRows = bets.map(bet => {
        return `${bet.id},${bet.userId},${bet.number},${bet.amount},${bet.round},${bet.date.toISOString()},${bet.isWin},${bet.winAmount}`;
      }).join("\n");
      
      const csv = csvHeader + csvRows;
      
      // Set response headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=bets-export-${new Date().toISOString().split("T")[0]}.csv`);
      
      // Send CSV response
      return res.send(csv);
    }
    
    // Default: JSON format
    res.json({
      count: bets.length,
      dateRange: {
        start: startDate ? startDate.toISOString() : "all-time",
        end: endDate ? endDate.toISOString() : "present"
      },
      bets
    });
  } catch (error) {
    console.error("Error exporting bets:", error);
    res.status(500).json({ message: "Error exporting bets data" });
  }
});

export default router;