// lib/db.js
// Koneksi ke Neon Postgres menggunakan driver serverless (HTTP-based),
// cocok untuk dipakai di Vercel Serverless Functions maupun server Node biasa.
//
// Pastikan environment variable DATABASE_URL sudah diset, contoh:
//   DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/siaga_darurat?sslmode=require

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.warn(
    '[siaga-darurat] PERINGATAN: environment variable DATABASE_URL belum diset. ' +
    'Buat database gratis di https://neon.tech lalu set DATABASE_URL di file .env (lokal) ' +
    'atau di Vercel Project Settings > Environment Variables (saat hosting).'
  );
}

// `sql` adalah fungsi template-literal: sql`SELECT * FROM users WHERE id = ${id}`
const sql = neon(process.env.DATABASE_URL || '');

module.exports = { sql };
