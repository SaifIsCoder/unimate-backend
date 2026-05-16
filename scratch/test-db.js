import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace("aws-1-ap-northeast-2.pooler.supabase.com", "db.jtrdbbpocosccpykndjk.supabase.co"),
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 30000, // 30 seconds
});

async function test() {
  console.log("Testing connection to:", process.env.DATABASE_URL.replace(/:[^:]+@/, ":****@"));
  try {
    const start = Date.now();
    const client = await pool.connect();
    console.log("Connected in", Date.now() - start, "ms");
    const res = await client.query("SELECT NOW()");
    console.log("Query result:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await pool.end();
  }
}

test();
