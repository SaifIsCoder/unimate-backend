import prisma from './src/config/prisma.js';
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

async function login(email, password) {
  const loginData = JSON.stringify({ email, password });
  const res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);
  if (res.statusCode !== 200) throw new Error(`Login failed for ${email}`);
  return res.data.data.accessToken;
}

async function main() {
  console.log('--- Starting Data Consistency Testing ---');

  console.log('\\n0. Ensuring users have a department...');
  const dept = await prisma.department.findFirst();
  if (dept) {
    try {
      await prisma.user.update({
        where: { email: 'superadmin@unimate.com' },
        data: { admin: { update: { departmentId: dept.id } } }
      });
    } catch (e) {}
    try {
      await prisma.user.update({
        where: { email: 'rbac_student@unimate.com' },
        data: { student: { update: { departmentId: dept.id } } }
      });
    } catch (e) {}
  }

  // 1. Get tokens
  console.log('\\n1. Acquiring tokens...');
  const adminToken = await login('superadmin@unimate.com', 'password123');
  const studentToken = await login('rbac_student@unimate.com', 'password123');
  console.log('Tokens acquired.');

  // 2. Student creates a post
  console.log('\\n2. Creating a Community Post...');
  const postData = JSON.stringify({
    title: 'Consistency Test Post',
    content: 'Testing dashboard to DB to mobile flow'
  });
  
  const createRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/community/posts', method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, postData);
  
  if (createRes.statusCode !== 201) {
    console.error('Failed to create post!', createRes.data);
    return;
  }
  
  const createdPostId = createRes.data.data.id;
  console.log(`Post created successfully via API. ID: ${createdPostId}`);

  // 3. Verify in DB directly
  console.log('\\n3. Database: Verifying data persistence...');
  const dbPost = await prisma.post.findUnique({ where: { id: createdPostId } });
  if (dbPost && dbPost.title === 'Consistency Test Post') {
    console.log('✅ Post successfully persisted in the database.');
  } else {
    console.log('❌ Post NOT found in the database!');
    return;
  }

  // 4. Student reads the post (Simulating Mobile App)
  console.log('\\n4. Mobile App: Student fetching Community Posts...');
  const fetchRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/community/posts', method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  if (fetchRes.statusCode !== 200) {
    console.error('Failed to fetch posts as student!', fetchRes.data);
    return;
  }

  const posts = fetchRes.data.data.data || fetchRes.data.data || [];
  const foundPost = posts.find(p => p.id === createdPostId);

  if (foundPost) {
    console.log(`✅ Student successfully fetched the new post via API! Title: "${foundPost.title}"`);
    console.log('--- Data Consistency Test PASSED ---');
  } else {
    console.log('❌ Student could NOT fetch the new post! Data consistency failed.');
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
