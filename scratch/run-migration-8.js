import pkg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrationPath = "s:/unimate/unimate-fyp/server/src/database/migrations/phase-8-link-attendance-schedule.sql";

async function migrate() {
  try {
    const sql = fs.readFileSync(migrationPath, "utf8");
    console.log("Applying migration...");
    await pool.query(sql);
    console.log("Migration applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
