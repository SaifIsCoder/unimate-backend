import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";
import { SUPER_ADMIN } from "../src/constants/roles.js";

async function main() {
  const email = "superadmin@unimate.com";
  const password = "adminpassword123";
  const adminId = "SA-001";
  const department = "Administration";

  console.log("Creating Super Admin...");

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // 1. Create User
    const userRes = await pool.query(
      "INSERT INTO users (email, role, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [email, SUPER_ADMIN, passwordHash]
    );
    const userId = userRes.rows[0].id;

    // 2. Create Admin Profile
    await pool.query(
      "INSERT INTO admins (user_id, admin_id, department) VALUES ($1, $2, $3)",
      [userId, adminId, department]
    );

    console.log("✅ Super Admin created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    console.error("❌ Failed to create Super Admin:", err.message);
  } finally {
    process.exit();
  }
}

main();
