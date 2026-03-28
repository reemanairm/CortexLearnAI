import http from 'http';

const data = JSON.stringify({
    username: 'reematest',
    email: 'reemacuckoo.test.2005@gmail.com',
    password: 'password123'
});

const req = http.request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Register Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
