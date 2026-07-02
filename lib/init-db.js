// lib/init-db.js
// Jalankan dengan: npm run db:init
// Membaca lib/schema.sql lalu mengeksekusinya ke database.
// Kompatibel dengan Supabase, Neon, Railway, atau Postgres manapun.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL belum diset. Buat file .env berisi:\n   DATABASE_URL=postgresql://...');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    max: 1,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  let schema = fs.readFileSync(schemaPath, 'utf-8');

  // Hapus baris komentar dulu, baru pisahkan per statement
  schema = schema.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

  console.log(`🚀 Menjalankan ${statements.length} statement SQL ke database...`);

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      const firstLine = stmt.split('\n').find(l => l.trim()).slice(0, 60);
      console.log(`✅ ${firstLine}...`);
    } catch (err) {
      // Abaikan error "already exists" (idempotent)
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
        console.log(`⏭️  Sudah ada, lewati.`);
      } else {
        console.error(`❌ Gagal:`, err.message);
      }
    }
  }

  await sql.end();
  console.log('🎉 Selesai! Database siap dipakai.');
}

main();
