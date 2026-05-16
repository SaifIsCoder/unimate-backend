import { pool } from "../src/config/db.js";

async function main() {
  console.log("Fixing profile tables (students, teachers)...");
  try {
    // Fix students table
    await pool.query("ALTER TABLE students ALTER COLUMN department DROP NOT NULL;");
    console.log("✅ students.department is now nullable!");

    // Fix teachers table
    await pool.query("ALTER TABLE teachers ALTER COLUMN department DROP NOT NULL;");
    console.log("✅ teachers.department is now nullable!");

  } catch (err) {
    console.error("❌ Failed to update tables:", err.message);
  } finally {
    process.exit();
  }
}

main();
