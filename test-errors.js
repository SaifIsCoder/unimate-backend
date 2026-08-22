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
  console.log('--- Starting Error Handling Testing ---');

  // 1. Missing Required Field (Validation Error -> 400 Bad Request)
  console.log('\\n1. Testing Validation Error (Missing password in login)...');
  const badLoginData = JSON.stringify({ email: 'superadmin@unimate.com' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(badLoginData) }
  }, badLoginData);
  
  console.log(`Status: ${loginRes.statusCode}`);
  if (loginRes.statusCode === 400 && loginRes.data && !loginRes.data.success) {
    console.log('✅ Correctly handled validation error (400 Bad Request).');
  } else {
    console.log('❌ Failed to handle validation correctly.', loginRes.data);
  }

  // 2. Unauthorized Access (Invalid Token -> 401 Unauthorized)
  console.log('\\n2. Testing Unauthorized Access (Invalid Bearer token)...');
  const authRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/users/me', method: 'GET',
    headers: { 'Authorization': `Bearer some-invalid-fake-token-12345` }
  });

  console.log(`Status: ${authRes.statusCode}`);
  if (authRes.statusCode === 401) {
    console.log('✅ Correctly rejected invalid token (401 Unauthorized).');
  } else {
    console.log('❌ Failed to reject invalid token correctly.', authRes.data);
  }

  // 3. Not Found (Non-existent Endpoint -> 404 Not Found)
  console.log('\\n3. Testing 404 Route Not Found...');
  const notFoundRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/this-route-does-not-exist', method: 'GET'
  });

  console.log(`Status: ${notFoundRes.statusCode}`);
  if (notFoundRes.statusCode === 404) {
    console.log('✅ Correctly handled missing route (404 Not Found).');
  } else {
    console.log('❌ Failed to handle missing route correctly.', notFoundRes.data);
  }

  // 4. Bad Resource ID Format (UUID validation -> 400 Bad Request)
  console.log('\\n4. Testing Bad UUID format...');
  const badUuidRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/courses/not-a-uuid', method: 'GET'
  });

  console.log(`Status: ${badUuidRes.statusCode}`);
  if (badUuidRes.statusCode === 400) {
    console.log('✅ Correctly validated UUID format on ID param (400 Bad Request).');
  } else {
    console.log('❌ Failed UUID validation.', badUuidRes.data);
  }

  console.log('\\n--- Error Testing Complete ---');
}

main().catch(console.error);
