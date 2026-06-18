import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Connect to Vercel Postgres using the connection string from env
const connectionString = process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/twowheeler';
const sql = postgres(connectionString);

async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Postgres tables initialized successfully.');
  } catch (err) {
    console.error('Error initializing Postgres tables:', err);
  }
}

// Automatically try to initialize DB on startup
initDb();

export default sql;
