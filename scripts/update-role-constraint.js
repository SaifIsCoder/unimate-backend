import { pool } from "../src/config/db.js";

async function main() {
  console.log("Updating database role constraint...");

  try {
    await pool.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    await pool.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('super_admin', 'admin', 'teacher', 'student'));
    `);

    console.log("✅ Database constraint updated successfully!");
  } catch (err) {
    console.error("❌ Failed to update constraint:", err.message);
  } finally {
    process.exit();
  }
}

main();
