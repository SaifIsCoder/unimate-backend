import prisma from './src/config/prisma.js';
import bcrypt from 'bcryptjs';
import http from 'http';

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('--- Starting RBAC Security Testing ---');

  // 1. Seed a test student
  console.log('1. Seeding test student...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const studentEmail = 'rbac_student@unimate.com';
  await prisma.user.upsert({
    where: { email: studentEmail },
    update: { passwordHash: hashedPassword, role: 'student' },
    create: {
      email: studentEmail,
      passwordHash: hashedPassword,
      role: 'student',
      isActive: true,
      student: {
        create: {
          rollNumber: 'RBAC-001',
          batch: 2026
        }
      }
    },
  });
  console.log('Test student seeded successfully.');

  // 2. Login as student
  console.log('\\n2. Logging in as student...');
  const loginData = JSON.stringify({ email: studentEmail, password: 'password123' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);

  if (loginRes.statusCode !== 200) {
    console.error('Student login failed!', loginRes.data);
    return;
  }
  const studentToken = loginRes.data.data.accessToken;
  console.log('Student login successful. Token acquired.');

  // 3. Try to access Admin-only route (/api/v1/users) with student token
  console.log('\\n3. Attempting to access admin route (GET /api/v1/users) as student...');
  const usersRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  console.log(`Response Status: ${usersRes.statusCode}`);
  console.log('Response Body:', usersRes.data);

  if (usersRes.statusCode === 403) {
    console.log('✅ RBAC successfully blocked unauthorized access (403 Forbidden).');
  } else {
    console.log('❌ RBAC failed! Expected 403, got', usersRes.statusCode);
  }

  // 4. Try to access Student's own profile (/api/v1/users/me)
  console.log('\\n4. Attempting to access self profile (GET /api/v1/users/me) as student...');
  const meRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/users/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  
  console.log(`Response Status: ${meRes.statusCode}`);
  if (meRes.statusCode === 200) {
    console.log('✅ Student successfully accessed their own profile.');
  } else {
    console.log('❌ Failed! Student should be able to access /me.');
  }

  console.log('\\n--- RBAC Testing Complete ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
