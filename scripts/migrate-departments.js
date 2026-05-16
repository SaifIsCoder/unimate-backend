import { pool } from "../src/config/db.js";

async function main() {
  console.log("Creating departments table and updating profiles...");

  try {
    // 1. Create departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Add department_id to students
    await pool.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
    `);

    // 3. Add department_id to teachers
    await pool.query(`
      ALTER TABLE teachers 
      ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
    `);

    // 4. Add department_id to admins
    await pool.query(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
    `);

    console.log("✅ Database schema updated successfully!");
  } catch (err) {
    console.error("❌ Failed to update schema:", err.message);
  } finally {
    process.exit();
  }
}

main();
