# Siaga Darurat — Backend + Database (siap hosting di Vercel)

Paket ini membuat semua fitur di **index.html**, **service.html**, dan
**teknisi.html** benar-benar berfungsi (bukan simulasi lagi) saat di-hosting,
dengan **tampilan yang sama sekali tidak diubah**.

## Apa yang sudah dibuat nyata

| Fitur | Sebelumnya | Sekarang |
|---|---|---|
| Login & daftar (pelanggan & teknisi) | `alert()` demo | Akun nyata, password ter-hash, JWT, tersimpan di database |
| Order bantuan kendaraan | Simulasi lokal di 1 browser | Order tersimpan di database, muncul nyata di dashboard teknisi manapun |
| Terima/tolak order (teknisi) | Data dummy `SIMULATED_ORDERS` | Order asli dari pelanggan + tetap ada contoh dummy sebagai pengisi |
| Lacak lokasi teknisi ⇄ pelanggan | `BroadcastChannel`/`localStorage` (1 browser saja) | Polling ke server tiap 3-5 detik (jalan lintas device/HP) |
| Chat pelanggan ⇄ teknisi | Hanya simulasi 1 arah di 1 browser | Pesan tersimpan di database, polling 4 detik |
| Rating & ulasan | `localStorage` | Tersimpan di database, otomatis update rata-rata rating teknisi |
| Rekening & tarik dana teknisi | `localStorage` | Tersimpan di database |

**Yang TETAP sebagai simulasi visual** (sengaja, karena murni dekoratif dan
tidak butuh server): animasi rute di peta, auto-reply chat dummy dari "AI",
efek confetti, dua kartu order contoh di Dashboard (Budi Santoso/Siti Rahayu),
section tips.

Karena di-hosting di **Vercel** (serverless), sinkronisasi real-time memakai
**polling** (cek server tiap beberapa detik) bukan WebSocket — sedikit lebih
lambat (jeda 2-5 detik) tapi 100% jalan di hosting gratis.

---

## Struktur folder

```
siaga-darurat/
├── api/index.js          ← entry point untuk Vercel
├── lib/
│   ├── db.js              ← koneksi database
│   ├── auth.js             ← JWT & password hashing
│   ├── schema.sql           ← skema tabel database
│   └── init-db.js           ← script untuk membuat tabel
├── routes/
│   ├── auth.js              ← register, login
│   ├── orders.js             ← order, lokasi, chat
│   ├── ratings.js            ← rating teknisi
│   └── bank.js               ← rekening & tarik dana
├── public/
│   ├── index.html             ← (tampilan sama, sudah disambungkan ke API)
│   ├── service.html            ← (tampilan sama, sudah disambungkan ke API)
│   ├── teknisi.html             ← (tampilan sama, sudah disambungkan ke API)
│   ├── sync.js                   ← file asli Anda (tetap dipakai untuk multi-tab)
│   └── api-client.js              ← BARU: jembatan ke backend
├── server.js              ← server Express (jalan lokal & di Vercel)
├── vercel.json             ← konfigurasi routing Vercel
├── package.json
└── .env.example
```

---

## LANGKAH 1 — Buat database gratis di Neon

1. Buka **https://neon.tech** → daftar gratis (bisa pakai akun Google/GitHub).
2. Klik **Create Project** → beri nama misalnya `siaga-darurat`.
3. Setelah project dibuat, buka tab **Connection string** / **Dashboard**.
   Salin connection string yang formatnya seperti:
   ```
   postgresql://namauser:password@ep-xxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Simpan dulu, akan dipakai di Langkah 3.

## LANGKAH 2 — Jalankan di komputer Anda dulu (opsional tapi disarankan)

```bash
cd siaga-darurat
npm install
cp .env.example .env
```

Buka file `.env`, isi:
```
DATABASE_URL=postgresql://...   (connection string dari Neon)
JWT_SECRET=...                  (string acak, bisa generate dengan perintah di bawah)
```

Generate `JWT_SECRET` acak:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Buat semua tabel di database:
```bash
npm run db:init
```

Jalankan server:
```bash
npm start
```

Buka browser ke `http://localhost:3000` → harusnya langsung tampil
**index.html** dengan tampilan yang sama seperti sebelumnya, tapi sekarang
daftar/masuk benar-benar tersimpan di database.

## LANGKAH 3 — Deploy ke Vercel (gratis)

### Cara A — lewat website Vercel (paling mudah, tanpa command line)
1. Push folder ini ke repository GitHub baru (lewat GitHub Desktop atau upload manual).
2. Buka **https://vercel.com** → daftar gratis → **Add New Project** → pilih
   repository GitHub Anda.
3. Saat diminta **Environment Variables**, tambahkan:
   - `DATABASE_URL` → connection string Neon dari Langkah 1
   - `JWT_SECRET` → string acak dari Langkah 2
4. Klik **Deploy**. Tunggu 1-2 menit.
5. Setelah selesai, Vercel akan memberi Anda alamat seperti
   `https://siaga-darurat-anda.vercel.app` — itulah alamat yang bisa dibuka
   semua orang.

### Cara B — lewat command line (kalau sudah biasa pakai terminal)
```bash
npm install -g vercel
vercel login
vercel
# Saat ditanya environment variables, isi DATABASE_URL dan JWT_SECRET
vercel --prod
```

### Setelah deploy: jalankan `db:init` sekali untuk membuat tabel
Karena Neon adalah database terpisah, Anda hanya perlu menjalankan
`npm run db:init` **satu kali** dari komputer Anda (dengan `.env` yang sudah
diisi `DATABASE_URL` dari Neon) — tabel akan otomatis tersedia juga untuk
versi yang di-hosting di Vercel, karena keduanya memakai database yang sama.

---

## Hal penting yang perlu diketahui

- **Satu domain untuk semua**: setelah deploy, alamat seperti
  `https://nama-app.vercel.app/index.html`,
  `https://nama-app.vercel.app/service.html`, dan
  `https://nama-app.vercel.app/teknisi.html` semuanya jalan dari domain yang
  sama, dan otomatis tersambung ke API yang sama (`/api/...`). Tidak perlu
  mengatur apa pun secara manual.
- **Login teknisi**: tampilan modal di index.html memang hanya punya form
  "Daftar" untuk teknisi (tidak ada form "Masuk" terpisah, sesuai desain
  aslinya). Jadi kalau teknisi yang sudah punya akun mengisi form daftar
  lagi dengan email & password yang sama, sistem otomatis akan login-kan
  dia (bukan menolak) — supaya tetap nyaman dipakai tanpa mengubah tampilan.
- **Mode tanpa login tetap berfungsi**: jika seseorang membuka service.html
  atau teknisi.html tanpa login (sesuai akses bebas yang sudah ada di
  desain awal), semua animasi/simulasi visual tetap berjalan seperti biasa
  — hanya saja datanya tidak tersimpan ke server.
- **Field password**: minimal 8 karakter (sudah sesuai placeholder asli
  "Min. 8 karakter").
- **Biaya**: Vercel free tier dan Neon free tier cukup untuk skripsi/demo/
  trafik kecil-menengah. Tidak perlu kartu kredit untuk mulai.

## Jika ingin memeriksa API secara manual
Setelah server jalan (lokal atau di Vercel), Anda bisa cek:
```
GET  /api/health                     → cek server hidup
POST /api/auth/register              → { role, firstName, email, password, ... }
POST /api/auth/login                 → { email, password }
POST /api/orders                     → buat order (butuh login sebagai pelanggan)
GET  /api/orders/pending             → lihat order masuk (butuh login sebagai teknisi)
```

Selamat mencoba! 🚗🔧
