import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name"),
  balance: integer("balance").default(0).notNull(),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  number: integer("number").notNull(),
  amount: integer("amount").notNull(),
  round: integer("round").notNull(), // 1 or 2
  date: timestamp("date").defaultNow().notNull(),
  isWin: boolean("is_win").default(false),
  winAmount: integer("win_amount").default(0),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  round1: integer("round1"),
  round2: integer("round2"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // deposit, withdraw, bet, win
  date: timestamp("date").defaultNow().notNull(),
  description: text("description"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const insertBetSchema = createInsertSchema(bets).pick({
  userId: true,
  number: true,
  amount: true,
  round: true,
});

export const insertResultSchema = createInsertSchema(results).pick({
  date: true,
  round1: true,
  round2: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true,
  description: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type Result = typeof results.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
