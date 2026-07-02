// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const ratingRoutes = require('./routes/ratings');
const bankRoutes = require('./routes/bank');

const app = express();

app.use(cors());
app.use(express.json());

// ── API ROUTES ──
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/bank', bankRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'siaga-darurat-backend', time: new Date().toISOString() });
});

// ── STATIC FRONTEND (HANYA RELEVAN SAAT JALAN LOKAL) ──
// Saat dijalankan lokal lewat `npm start`, baris ini membuat server yang
// sama menyajikan index.html, service.html, teknisi.html, sync.js, dan
// api-client.js dari folder /public.
//
// Saat di-deploy ke VERCEL, baris ini TIDAK dipakai untuk menyajikan file
// statis (Vercel tidak menjalankan express.static() di dalam Function).
// Sebagai gantinya, Vercel SECARA OTOMATIS menyajikan semua isi folder
// /public lewat CDN-nya sendiri (lihat dokumentasi "Express on Vercel"),
// tanpa perlu vercel.json sama sekali — file ini (server.js) terdeteksi
// otomatis sebagai entrypoint Express karena ada di root project.
app.use(express.static(path.join(__dirname, 'public')));

// Fallback 404 khusus untuk path /api/* yang tidak cocok
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

const PORT = process.env.PORT || 3000;

// Saat dijalankan langsung (bukan di-import oleh Vercel), nyalakan server.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Siaga Darurat backend berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
