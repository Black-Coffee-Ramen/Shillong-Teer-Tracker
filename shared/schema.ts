import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  name: text("name"),
  isVerified: boolean("is_verified").default(false),
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
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  status: text("status").default("pending"), // pending, completed, failed
  metadata: json("metadata").$type<Record<string, any>>().notNull().default({}), // Additional data like bet number, round, etc.
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  email: text("email"),
  code: text("code").notNull(),
  type: text("type").notNull(), // registration, login, password-reset
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
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
  razorpayOrderId: true,
  razorpayPaymentId: true,
  razorpaySignature: true,
  status: true,
  metadata: true,
});

export const insertOtpSchema = createInsertSchema(otpCodes).pick({
  phone: true,
  email: true,
  code: true,
  type: true,
  expiresAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertOtp = z.infer<typeof insertOtpSchema>;

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id),  // Null for group messages
  groupId: integer("group_id"),  // Will reference chat_groups if using groups
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: json("metadata") // For any additional info like attachments, etc.
});

// Chat groups table
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => chatGroups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").default("member").notNull(), // member, admin, etc.
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open").notNull(), // open, in-progress, closed
  priority: text("priority").default("medium").notNull(), // low, medium, high
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  assignedTo: integer("assigned_to").references(() => users.id), // Admin who is handling the ticket
});

// Support ticket responses table
export const ticketResponses = pgTable("ticket_responses", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  responderId: integer("responder_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isInternal: boolean("is_internal").default(false).notNull(), // If true, only visible to admins
});

// Insert schemas for the new tables
export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  senderId: true,
  receiverId: true,
  groupId: true,
  content: true,
  isRead: true,
  metadata: true,
});

export const insertChatGroupSchema = createInsertSchema(chatGroups).pick({
  name: true,
  description: true,
  createdBy: true,
  isActive: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
  isActive: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  userId: true,
  subject: true,
  description: true,
  status: true,
  priority: true,
  assignedTo: true,
});

export const insertTicketResponseSchema = createInsertSchema(ticketResponses).pick({
  ticketId: true,
  responderId: true,
  content: true,
  isInternal: true,
});

// Insert types
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type InsertTicketResponse = z.infer<typeof insertTicketResponseSchema>;

export type User = typeof users.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type Result = typeof results.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;

// New types
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatGroup = typeof chatGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type TicketResponse = typeof ticketResponses.$inferSelect;
