// lib/init-db.js
// Jalankan dengan: npm run db:init
// Membaca lib/schema.sql lalu mengeksekusinya ke database Neon
// yang ditunjuk oleh environment variable DATABASE_URL.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL belum diset. Buat file .env berisi:\n   DATABASE_URL=postgresql://...');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const schemaPath = path.join(__dirname, 'schema.sql');
  let schema = fs.readFileSync(schemaPath, 'utf-8');

  // Hapus baris komentar (--...) dulu, baru pisahkan per statement
  // berdasarkan titik-koma. Ini lebih aman daripada regex pada baris asli,
  // karena komentar bisa berada di antara definisi kolom multi-baris.
  schema = schema.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

  console.log(`🚀 Menjalankan ${statements.length} statement SQL ke database...`);

  for (const stmt of statements) {
    try {
      await sql(stmt);
      const firstLine = stmt.split('\n')[0].slice(0, 60);
      console.log(`✅ ${firstLine}...`);
    } catch (err) {
      console.error(`❌ Gagal menjalankan statement:\n${stmt}\n`, err.message);
    }
  }

  console.log('🎉 Selesai! Database siap dipakai.');
}

main();
