import { pool } from '../src/config/db.js';
import bcrypt from 'bcryptjs';

async function main() {
  const res = await pool.query("SELECT * FROM users WHERE email = 'superadmin@unimate.com'");
  if (res.rows.length === 0) {
    console.log("User not found!");
  } else {
    const user = res.rows[0];
    console.log("User found:", { email: user.email, role: user.role, isActive: user.is_active, hash: user.password_hash });
    const match = await bcrypt.compare("password123", user.password_hash);
    console.log("Password match:", match);
  }
  process.exit(0);
}

main().catch(console.error);
