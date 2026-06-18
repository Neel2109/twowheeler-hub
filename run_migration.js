import postgres from 'postgres';
import fs from 'fs';

const connectionString = 'postgresql://postgres:neelpatel%402109@db.bryhdzopaokewdmjcgno.supabase.co:5432/postgres';
const sql = postgres(connectionString);

async function run() {
  try {
    const script = fs.readFileSync('C:/Users/Neel_Patel/.gemini/antigravity-ide/brain/d53ce098-2336-492c-913b-1b162555da22/supabase_init.sql', 'utf8');
    
    console.log('Running migration script...');
    await sql.unsafe(script);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await sql.end();
  }
}

run();
