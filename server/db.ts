import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Check if DATABASE_URL exists and is properly set
const dbUrl = process.env.DATABASE_URL;
console.log("DATABASE_URL environment variable check:", 
  dbUrl ? "exists" : "not found", 
  dbUrl ? `(length: ${dbUrl.length})` : "");

// Force the use of in-memory storage for local development
// Change this to false if you want to use a real database
const FORCE_IN_MEMORY = true;

// Determine if we should use a real database
const useRealDatabase = !FORCE_IN_MEMORY && 
                        dbUrl && 
                        dbUrl.trim() !== "" && 
                        dbUrl.includes("postgres");

// Create database connection objects
let pool: Pool | null = null;
let db: any = null;

// Only try to connect to the database if we're using it
if (useRealDatabase) {
  try {
    console.log("Attempting to connect to PostgreSQL database...");
    
    // Configure Neon websocket
    neonConfig.webSocketConstructor = ws;
    
    // Create connection pool and drizzle instance
    pool = new Pool({ connectionString: dbUrl });
    db = drizzle({ client: pool, schema });
    
    console.log("Successfully configured database connection");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to connect to database:", errorMessage);
    pool = null;
    db = null;
  }
} else {
  console.log("Using in-memory storage instead of database");
}

export { pool, db };
