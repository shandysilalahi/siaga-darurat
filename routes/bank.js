// routes/bank.js
const express = require('express');
const router = express.Router();
const { sql } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');

router.use(requireAuth, requireRole('teknisi'));

// ── GET /api/bank ── (daftar rekening milik teknisi yang login)
router.get('/', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM bank_accounts WHERE technician_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json({ accounts: rows });
  } catch (err) {
    console.error('Get bank accounts error:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar rekening.' });
  }
});

// ── POST /api/bank ── (tambah rekening baru)
// body: { method, accountName, accountNumber }
router.post('/', async (req, res) => {
  try {
    const { method, accountName, accountNumber } = req.body;
    if (!method || !accountName || !accountNumber) {
      return res.status(400).json({ error: 'method, accountName, dan accountNumber wajib diisi.' });
    }
    const rows = await sql`
      INSERT INTO bank_accounts (technician_id, method, account_name, account_number)
      VALUES (${req.user.id}, ${method}, ${accountName}, ${accountNumber})
      RETURNING *
    `;
    res.status(201).json({ account: rows[0] });
  } catch (err) {
    console.error('Add bank account error:', err);
    res.status(500).json({ error: 'Gagal menambah rekening.' });
  }
});

// ── DELETE /api/bank/:id ── (hapus rekening)
router.delete('/:id', async (req, res) => {
  try {
    const rows = await sql`
      DELETE FROM bank_accounts WHERE id = ${req.params.id} AND technician_id = ${req.user.id}
      RETURNING id
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Rekening tidak ditemukan.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete bank account error:', err);
    res.status(500).json({ error: 'Gagal menghapus rekening.' });
  }
});

// ── POST /api/bank/withdraw ── (ajukan tarik dana)
// body: { bankAccountId, amount }
router.post('/withdraw', async (req, res) => {
  try {
    const { bankAccountId, amount } = req.body;
    if (!bankAccountId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'bankAccountId dan amount (>0) wajib diisi.' });
    }
    const accRows = await sql`
      SELECT id FROM bank_accounts WHERE id = ${bankAccountId} AND technician_id = ${req.user.id}
    `;
    if (!accRows[0]) return res.status(404).json({ error: 'Rekening tidak ditemukan.' });

    const rows = await sql`
      INSERT INTO withdrawals (technician_id, bank_account_id, amount, status)
      VALUES (${req.user.id}, ${bankAccountId}, ${amount}, 'pending')
      RETURNING *
    `;
    res.status(201).json({ withdrawal: rows[0] });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Gagal mengajukan tarik dana.' });
  }
});

module.exports = router;
