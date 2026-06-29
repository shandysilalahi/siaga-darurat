// routes/ratings.js
const express = require('express');
const router = express.Router();
const { sql } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');

router.use(requireAuth);

// ── POST /api/ratings ── (pelanggan memberi rating setelah order selesai)
// body: { orderId, stars, comment }
router.post('/', requireRole('pelanggan'), async (req, res) => {
  try {
    const { orderId, stars, comment } = req.body;
    if (!orderId || !stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'orderId dan stars (1-5) wajib diisi.' });
    }

    const orderRows = await sql`
      SELECT * FROM orders WHERE id = ${orderId} AND customer_id = ${req.user.id}
    `;
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    if (!order.technician_id) return res.status(400).json({ error: 'Pesanan ini belum memiliki teknisi.' });

    const rows = await sql`
      INSERT INTO ratings (order_id, technician_id, customer_id, stars, comment)
      VALUES (${orderId}, ${order.technician_id}, ${req.user.id}, ${stars}, ${comment || ''})
      RETURNING *
    `;

    // Update rata-rata rating teknisi
    const aggRows = await sql`
      SELECT AVG(stars)::numeric(2,1) AS avg_stars, COUNT(*) AS total
      FROM ratings WHERE technician_id = ${order.technician_id}
    `;
    const { avg_stars, total } = aggRows[0];
    await sql`
      UPDATE users SET rating_avg = ${avg_stars}, rating_count = ${total}
      WHERE id = ${order.technician_id}
    `;

    res.status(201).json({ rating: rows[0] });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ error: 'Gagal mengirim ulasan.' });
  }
});

// ── GET /api/ratings/me ── (teknisi: lihat semua ulasan untuk dirinya)
router.get('/me', requireRole('teknisi'), async (req, res) => {
  try {
    const rows = await sql`
      SELECT r.*, c.first_name AS customer_first_name, c.last_name AS customer_last_name, o.service_title
      FROM ratings r
      JOIN users c ON c.id = r.customer_id
      JOIN orders o ON o.id = r.order_id
      WHERE r.technician_id = ${req.user.id}
      ORDER BY r.created_at DESC
    `;
    res.json({ ratings: rows });
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ error: 'Gagal mengambil ulasan.' });
  }
});

module.exports = router;
