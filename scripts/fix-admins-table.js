import { pool } from "../src/config/db.js";

async function main() {
  console.log("Making admins.department column nullable...");
  try {
    await pool.query("ALTER TABLE admins ALTER COLUMN department DROP NOT NULL;");
    console.log("✅ admins.department is now nullable!");
  } catch (err) {
    console.error("❌ Failed to update table:", err.message);
  } finally {
    process.exit();
  }
}

main();
