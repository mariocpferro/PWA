const { randomBytes } = require('crypto');
console.log('AUTH_SECRET=' + randomBytes(32).toString('base64'));
