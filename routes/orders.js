// routes/orders.js
const express = require('express');
const router = express.Router();
const { sql } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');

router.use(requireAuth);

// ── POST /api/orders ── (pelanggan membuat order baru)
// body: { serviceKey, serviceTitle, notes, customerLat, customerLng, customerAddress }
router.post('/', requireRole('pelanggan'), async (req, res) => {
  try {
    const { serviceKey, serviceTitle, notes, customerLat, customerLng, customerAddress } = req.body;
    if (!serviceKey || !serviceTitle) {
      return res.status(400).json({ error: 'serviceKey dan serviceTitle wajib diisi.' });
    }

    const rows = await sql`
      INSERT INTO orders (customer_id, service_key, service_title, notes, state, customer_lat, customer_lng, customer_address)
      VALUES (${req.user.id}, ${serviceKey}, ${serviceTitle}, ${notes || ''}, 'SEARCHING_TECHNICIAN', ${customerLat || null}, ${customerLng || null}, ${customerAddress || null})
      RETURNING *
    `;
    res.status(201).json({ order: rows[0] });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Gagal membuat pesanan.' });
  }
});

// ── GET /api/orders/pending ── (teknisi: daftar order yang masih mencari teknisi)
router.get('/pending', requireRole('teknisi'), async (req, res) => {
  try {
    const rows = await sql`
      SELECT o.*, u.first_name AS customer_first_name, u.last_name AS customer_last_name, u.phone AS customer_phone
      FROM orders o
      JOIN users u ON u.id = o.customer_id
      WHERE o.state = 'SEARCHING_TECHNICIAN'
      ORDER BY o.created_at ASC
      LIMIT 20
    `;
    res.json({ orders: rows });
  } catch (err) {
    console.error('Pending orders error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar pesanan.' });
  }
});

// ── GET /api/orders/active ── (polling: order aktif milik user yang login)
// Dipakai pelanggan & teknisi untuk tahu status order terkini tanpa WebSocket.
router.get('/active', async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'pelanggan') {
      rows = await sql`
        SELECT o.*,
          c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.phone AS customer_phone,
          t.first_name AS technician_first_name, t.last_name AS technician_last_name, t.phone AS technician_phone, t.vehicle AS technician_vehicle
        FROM orders o
        JOIN users c ON c.id = o.customer_id
        LEFT JOIN users t ON t.id = o.technician_id
        WHERE o.customer_id = ${req.user.id}
          AND o.state NOT IN ('SERVICE_COMPLETED', 'ORDER_CANCELLED')
        ORDER BY o.created_at DESC
        LIMIT 1
      `;
    } else {
      rows = await sql`
        SELECT o.*,
          c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.phone AS customer_phone,
          t.first_name AS technician_first_name, t.last_name AS technician_last_name, t.phone AS technician_phone, t.vehicle AS technician_vehicle
        FROM orders o
        JOIN users c ON c.id = o.customer_id
        LEFT JOIN users t ON t.id = o.technician_id
        WHERE o.technician_id = ${req.user.id}
          AND o.state NOT IN ('SERVICE_COMPLETED', 'ORDER_CANCELLED')
        ORDER BY o.created_at DESC
        LIMIT 1
      `;
    }
    res.json({ order: rows[0] || null });
  } catch (err) {
    console.error('Active order error:', err);
    res.status(500).json({ error: 'Gagal mengambil pesanan aktif.' });
  }
});

// ── GET /api/orders/:id ── (ambil 1 order spesifik, untuk polling status detail)
router.get('/:id', async (req, res) => {
  try {
    const rows = await sql`
      SELECT o.*,
        c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.phone AS customer_phone,
        t.first_name AS technician_first_name, t.last_name AS technician_last_name, t.phone AS technician_phone, t.vehicle AS technician_vehicle
      FROM orders o
      JOIN users c ON c.id = o.customer_id
      LEFT JOIN users t ON t.id = o.technician_id
      WHERE o.id = ${req.params.id}
        AND (o.customer_id = ${req.user.id} OR o.technician_id = ${req.user.id})
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    res.json({ order: rows[0] });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Gagal mengambil pesanan.' });
  }
});

// ── POST /api/orders/:id/accept ── (teknisi menerima order)
router.post('/:id/accept', requireRole('teknisi'), async (req, res) => {
  try {
    const { techLat, techLng, distanceKm, etaMinutes } = req.body;
    const rows = await sql`
      UPDATE orders SET
        technician_id = ${req.user.id},
        state = 'TECHNICIAN_FOUND',
        technician_lat = ${techLat || null},
        technician_lng = ${techLng || null},
        distance_km = ${distanceKm || 0},
        eta_minutes = ${etaMinutes || 0},
        updated_at = now()
      WHERE id = ${req.params.id} AND state = 'SEARCHING_TECHNICIAN'
      RETURNING *
    `;
    if (!rows[0]) return res.status(409).json({ error: 'Pesanan sudah diambil teknisi lain atau dibatalkan.' });
    res.json({ order: rows[0] });
  } catch (err) {
    console.error('Accept order error:', err);
    res.status(500).json({ error: 'Gagal menerima pesanan.' });
  }
});

// ── POST /api/orders/:id/reject ── (teknisi menolak; order kembali mencari teknisi lain)
router.post('/:id/reject', requireRole('teknisi'), async (req, res) => {
  try {
    // Menolak hanya berarti "skip" untuk teknisi ini — order tetap SEARCHING_TECHNICIAN
    // sehingga teknisi lain masih bisa menerimanya.
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menolak pesanan.' });
  }
});

// ── PATCH /api/orders/:id/state ── (update state generik, dipakai kedua sisi)
// body: { state, cost?, durationSeconds? }
const VALID_STATES = [
  'SEARCHING_TECHNICIAN', 'TECHNICIAN_FOUND', 'TECHNICIAN_ACCEPTED',
  'TECHNICIAN_ON_THE_WAY', 'TECHNICIAN_ARRIVED', 'SERVICE_IN_PROGRESS',
  'SERVICE_COMPLETED', 'ORDER_CANCELLED'
];
router.patch('/:id/state', async (req, res) => {
  try {
    const { state, cost, durationSeconds } = req.body;
    if (!VALID_STATES.includes(state)) {
      return res.status(400).json({ error: 'State tidak valid.' });
    }

    const rows = await sql`
      UPDATE orders SET
        state = ${state},
        cost = COALESCE(${cost ?? null}, cost),
        duration_seconds = COALESCE(${durationSeconds ?? null}, duration_seconds),
        started_at = CASE WHEN ${state} = 'SERVICE_IN_PROGRESS' THEN now() ELSE started_at END,
        completed_at = CASE WHEN ${state} = 'SERVICE_COMPLETED' THEN now() ELSE completed_at END,
        updated_at = now()
      WHERE id = ${req.params.id}
        AND (customer_id = ${req.user.id} OR technician_id = ${req.user.id})
      RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    res.json({ order: rows[0] });
  } catch (err) {
    console.error('Update state error:', err);
    res.status(500).json({ error: 'Gagal mengubah status pesanan.' });
  }
});

// ── POST /api/orders/:id/location ── (kirim update lokasi GPS, dipakai polling 3-5 detik)
// body: { lat, lng, distanceKm?, etaMinutes?, speedKmh? } — role menentukan kolom yang diupdate
router.post('/:id/location', async (req, res) => {
  try {
    const { lat, lng, distanceKm, etaMinutes, speedKmh } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat dan lng wajib berupa angka.' });
    }

    let rows;
    if (req.user.role === 'teknisi') {
      rows = await sql`
        UPDATE orders SET
          technician_lat = ${lat}, technician_lng = ${lng},
          distance_km = COALESCE(${distanceKm ?? null}, distance_km),
          eta_minutes = COALESCE(${etaMinutes ?? null}, eta_minutes),
          updated_at = now()
        WHERE id = ${req.params.id} AND technician_id = ${req.user.id}
        RETURNING *
      `;
    } else {
      rows = await sql`
        UPDATE orders SET
          customer_lat = ${lat}, customer_lng = ${lng},
          updated_at = now()
        WHERE id = ${req.params.id} AND customer_id = ${req.user.id}
        RETURNING *
      `;
    }
    if (!rows[0]) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    res.json({ order: rows[0] });
  } catch (err) {
    console.error('Update location error:', err);
    res.status(500).json({ error: 'Gagal mengirim lokasi.' });
  }
});

// ── GET /api/orders/:id/messages ── (ambil chat, untuk polling)
router.get('/:id/messages', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM chat_messages WHERE order_id = ${req.params.id} ORDER BY created_at ASC
    `;
    res.json({ messages: rows });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Gagal mengambil chat.' });
  }
});

// ── POST /api/orders/:id/messages ── (kirim chat)
// body: { message }
router.post('/:id/messages', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });

    const sender = req.user.role; // 'pelanggan' | 'teknisi'
    const rows = await sql`
      INSERT INTO chat_messages (order_id, sender, message)
      VALUES (${req.params.id}, ${sender}, ${message.trim()})
      RETURNING *
    `;
    res.status(201).json({ message: rows[0] });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Gagal mengirim pesan.' });
  }
});

module.exports = router;
