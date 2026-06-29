// api/index.js
// Entry point untuk Vercel Serverless Functions.
// Vercel akan menjalankan setiap request ke /api/* lewat file ini,
// yang meneruskan ke aplikasi Express yang sama dipakai untuk
// development lokal (lihat server.js).
module.exports = require('../server.js');
