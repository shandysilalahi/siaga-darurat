// routes/auth.js
const express = require('express');
const router = express.Router();
const { sql } = require('../lib/db');
const { hashPassword, comparePassword, signToken } = require('../lib/auth');

// ── POST /api/auth/register ──
// body: { role: 'pelanggan'|'teknisi', firstName, lastName, email, phone, password, speciality?, city? }
router.post('/register', async (req, res) => {
  try {
    const { role, firstName, lastName, email, phone, password, speciality, city } = req.body;

    if (!role || !['pelanggan', 'teknisi'].includes(role)) {
      return res.status(400).json({ error: 'Role harus pelanggan atau teknisi.' });
    }
    if (!firstName || !email || !password) {
      return res.status(400).json({ error: 'Nama depan, email, dan password wajib diisi.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk.' });
    }

    const passwordHash = hashPassword(password);

    const rows = await sql`
      INSERT INTO users (role, first_name, last_name, email, phone, password_hash, speciality, city)
      VALUES (${role}, ${firstName}, ${lastName || ''}, ${email.toLowerCase()}, ${phone || ''}, ${passwordHash}, ${speciality || null}, ${city || null})
      RETURNING id, role, first_name, last_name, email, phone, speciality, city, vehicle, rating_avg, rating_count
    `;
    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftar. Silakan coba lagi.' });
  }
});

// ── POST /api/auth/login ──
// body: { email, password, role? }
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
    const user = rows[0];

    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }
    if (role && user.role !== role) {
      return res.status(403).json({ error: `Akun ini terdaftar sebagai ${user.role}, bukan ${role}.` });
    }

    delete user.password_hash;
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Gagal masuk. Silakan coba lagi.' });
  }
});

// ── GET /api/auth/me ── (validasi token & ambil data user terbaru)
router.get('/me', async (req, res) => {
  const { requireAuth } = require('../lib/auth');
  requireAuth(req, res, async () => {
    try {
      const rows = await sql`
        SELECT id, role, first_name, last_name, email, phone, speciality, city, vehicle, is_online, rating_avg, rating_count
        FROM users WHERE id = ${req.user.id}
      `;
      if (!rows[0]) return res.status(404).json({ error: 'User tidak ditemukan.' });
      res.json({ user: rows[0] });
    } catch (err) {
      console.error('Me error:', err);
      res.status(500).json({ error: 'Gagal mengambil data user.' });
    }
  });
});

module.exports = router;
