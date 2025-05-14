import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

// Run migrations
async function main() {
  console.log('Creating tables if they do not exist...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      name TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      balance INTEGER DEFAULT 0 NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      number INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      round INTEGER NOT NULL,
      date TIMESTAMP DEFAULT NOW() NOT NULL,
      is_win BOOLEAN DEFAULT FALSE,
      win_amount INTEGER DEFAULT 0
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP DEFAULT NOW() NOT NULL,
      round1 INTEGER,
      round2 INTEGER
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      date TIMESTAMP DEFAULT NOW() NOT NULL,
      description TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      status TEXT DEFAULT 'pending',
      metadata JSONB NOT NULL DEFAULT '{}'
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      email TEXT,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      is_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  console.log('All tables created successfully!');
}

// Run the main function
main()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });