import http from 'http';

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runAuthTests() {
  console.log('--- Starting Auth Tests ---');
  
  // 1. Test Login
  console.log('\\n1. Testing Login...');
  const loginData = JSON.stringify({ email: 'superadmin@unimate.com', password: 'password123' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);
  
  console.log(`Login Status: ${loginRes.statusCode}`);
  if (loginRes.statusCode !== 200) {
    console.error('Login Failed', loginRes.data);
    return;
  }
  
  const accessToken = loginRes.data.data.accessToken;
  const refreshToken = loginRes.data.data.refreshToken;
  console.log('Login successful. Access token and refresh token received.');

  // 2. Test Session State (/me)
  console.log('\\n2. Testing Session State (/me)...');
  const meRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/auth/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  console.log(`/me Status: ${meRes.statusCode}`);
  console.log(`/me Data: ${meRes.data.data.email} (${meRes.data.data.role})`);

  // 3. Test Refresh Token
  console.log('\\n3. Testing Refresh Token...');
  const refreshData = JSON.stringify({ refreshToken });
  const refreshRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/auth/refresh', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(refreshData) }
  }, refreshData);
  console.log(`Refresh Status: ${refreshRes.statusCode}`);
  
  if (refreshRes.statusCode === 200 && refreshRes.data.data.accessToken) {
    console.log('Token successfully refreshed.');
  } else {
    console.log('Refresh failed:', refreshRes.data);
  }

  // 4. Test Logout
  console.log('\\n4. Testing Logout...');
  // Pass both token types just in case the server expects them in body or headers
  const logoutData = JSON.stringify({ refreshToken });
  const logoutRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/v1/auth/logout', method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(logoutData)
    }
  }, logoutData);
  console.log(`Logout Status: ${logoutRes.statusCode}`);
  console.log(`Logout Response: ${logoutRes.data.message || logoutRes.data.data?.message || 'Success'}`);

  console.log('\\n--- Auth Tests Complete ---');
}

runAuthTests().catch(console.error);
