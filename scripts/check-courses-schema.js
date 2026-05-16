import { pool } from "../src/config/db.js";

async function main() {
  console.log("Checking courses table schema...");
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Failed to fetch schema:", err.message);
  } finally {
    process.exit();
  }
}

main();
