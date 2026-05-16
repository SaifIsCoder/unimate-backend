import { pool } from "../src/config/db.js";

async function main() {
  console.log("Updating courses table schema...");
  try {
    await pool.query(`
      -- 1. Add department_id
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

      -- 2. Make legacy department column nullable
      ALTER TABLE courses ALTER COLUMN department DROP NOT NULL;

      -- 3. Fix has_practical (add default and make nullable or just provide default)
      ALTER TABLE courses ALTER COLUMN has_practical SET DEFAULT false;
      ALTER TABLE courses ALTER COLUMN has_practical DROP NOT NULL;

      -- 4. Fix updated_at (add default)
      ALTER TABLE courses ALTER COLUMN updated_at SET DEFAULT NOW();
      ALTER TABLE courses ALTER COLUMN updated_at DROP NOT NULL;
    `);
    console.log("✅ Courses table schema updated successfully!");
  } catch (err) {
    console.error("❌ Failed to update courses table:", err.message);
  } finally {
    process.exit();
  }
}

main();
