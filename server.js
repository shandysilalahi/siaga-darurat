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

// ── STATIC FRONTEND ──
// Menyajikan index.html, service.html, teknisi.html, sync.js, config.js
// dari folder /public agar saat di-deploy (mis. ke Vercel) satu domain
// yang sama melayani front-end DAN API.
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
