const http = require('http');

const optionsHealth = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/health',
  method: 'GET'
};

const reqHealth = http.request(optionsHealth, (res) => {
  console.log(`Health Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Health Body:', data));
});
reqHealth.on('error', e => console.error('Health Error:', e));
reqHealth.end();

const postData = JSON.stringify({
  email: 'superadmin@unimate.com',
  password: 'password123'
});

const optionsLogin = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const reqLogin = http.request(optionsLogin, (res) => {
  console.log(`Login Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Login Body:', data);
    try {
      const json = JSON.parse(data);
      if (json.data && json.data.accessToken) {
        console.log('Token successfully obtained!');
        
        // Test a protected route, e.g. /api/v1/users
        const optionsUsers = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/v1/users',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${json.data.accessToken}`
          }
        };
        const reqUsers = http.request(optionsUsers, (resUser) => {
          console.log(`Users Status: ${resUser.statusCode}`);
          let dataUser = '';
          resUser.on('data', chunk => dataUser += chunk);
          resUser.on('end', () => console.log('Users Body (first 100 chars):', dataUser.substring(0, 100)));
        });
        reqUsers.end();

        // Test courses
        const optionsCourses = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/v1/courses',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${json.data.accessToken}`
          }
        };
        const reqCourses = http.request(optionsCourses, (resCourses) => {
          console.log(`Courses Status: ${resCourses.statusCode}`);
          let dataCourses = '';
          resCourses.on('data', chunk => dataCourses += chunk);
          resCourses.on('end', () => console.log('Courses Body (first 100 chars):', dataCourses.substring(0, 100)));
        });
        reqCourses.end();
      }
    } catch (err) {}
  });
});
reqLogin.on('error', e => console.error('Login Error:', e));
reqLogin.write(postData);
reqLogin.end();
