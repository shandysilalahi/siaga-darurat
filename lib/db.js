// lib/db.js
// Koneksi database menggunakan driver `postgres` (porsager/postgres),
// kompatibel dengan Supabase, Neon, Railway, atau Postgres mana pun.
//
// Set environment variable DATABASE_URL di file .env (lokal) atau
// di Vercel Project Settings > Environment Variables (saat hosting).
//
// Format Supabase:
//   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
//
// Format Neon (jika masih pakai Neon):
//   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require

const postgres = require('postgres');

if (!process.env.DATABASE_URL) {
  console.warn(
    '[siaga-darurat] PERINGATAN: DATABASE_URL belum diset.\n' +
    'Buat database gratis di https://supabase.com lalu set DATABASE_URL\n' +
    'di file .env (lokal) atau Vercel Project Settings (hosting).'
  );
}

// Buat koneksi. ssl: 'require' dibutuhkan untuk Supabase dan Neon.
const sql = postgres(process.env.DATABASE_URL || 'postgresql://localhost/siaga', {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 10,          // maksimal 10 koneksi paralel
  idle_timeout: 20, // tutup koneksi idle setelah 20 detik
  connect_timeout: 10,
});

module.exports = { sql };
