np# Siaga Darurat — Panduan Lengkap Setup & Hosting (untuk Pemula)

Panduan ini ditulis selangkah demi selangkah, dengan asumsi Anda **belum
pernah** memakai terminal, Git, atau Vercel sebelumnya. Ikuti urutannya dari
atas ke bawah, jangan dilompat.

**Yang akan Anda dapatkan di akhir panduan ini:** sebuah alamat website
(contoh: `https://siaga-darurat-anda.vercel.app`) yang bisa dibuka siapa saja
di internet, dengan tampilan yang **sama persis** seperti file asli Anda,
tapi sekarang login, order, chat, rating, dan rekening teknisi semuanya
**benar-benar tersimpan** di database — bukan simulasi lagi.

---

## Daftar Isi

- [Bagian 0 — Persiapan Software di Komputer](#bagian-0--persiapan-software-di-komputer)
- [Bagian 1 — Buat Database Gratis (Neon)](#bagian-1--buat-database-gratis-neon)
- [Bagian 2 — Coba Jalankan di Komputer Sendiri](#bagian-2--coba-jalankan-di-komputer-sendiri-lokal)
- [Bagian 3 — Upload Project ke GitHub](#bagian-3--upload-project-ke-github)
- [Bagian 4 — Deploy ke Vercel](#bagian-4--deploy-ke-vercel)
- [Bagian 5 — Buat Tabel di Database Production](#bagian-5--buat-tabel-di-database-production)
- [Bagian 6 — Tes Website yang Sudah Online](#bagian-6--tes-website-yang-sudah-online)
- [Bagian 7 — Hal Penting yang Perlu Diketahui](#bagian-7--hal-penting-yang-perlu-diketahui)
- [Bagian 8 — Troubleshooting (Kalau Ada Error)](#bagian-8--troubleshooting-kalau-ada-error)
- [Lampiran — Daftar Endpoint API](#lampiran--daftar-endpoint-api)

---

## Bagian 0 — Persiapan Software di Komputer

Sebelum mulai, install 2 software ini kalau belum punya.

### 0.1 Install Node.js

1. Buka **https://nodejs.org**
2. Download versi **LTS** (yang tulisannya "Recommended for most users").
3. Jalankan file installer-nya, klik **Next** terus sampai selesai (pengaturan
   default sudah benar, tidak perlu diubah).
4. Setelah selesai, buka **Command Prompt** (Windows) atau **Terminal**
   (Mac/Linux), lalu ketik:
   ```
   node --version
   ```
   Kalau muncul nomor versi (misalnya `v20.11.0`), berarti berhasil.

### 0.2 Install Git

1. Buka **https://git-scm.com/downloads**
2. Download sesuai sistem operasi Anda (Windows/Mac/Linux).
3. Install seperti biasa (klik Next terus, default sudah cukup).
4. Cek dengan mengetik di terminal:
   ```
   git --version
   ```

### 0.3 Buat akun GitHub (kalau belum punya)

1. Buka **https://github.com**
2. Klik **Sign up**, isi email, password, username, lalu ikuti instruksinya.
3. Verifikasi email Anda (cek inbox).

### 0.4 Ekstrak file ZIP yang sudah diberikan

1. Cari file `siaga-darurat-fullstack.zip` yang sudah Anda download.
2. Klik kanan → **Extract All** (Windows) atau double-click (Mac) untuk
   mengekstraknya.
3. Anda akan mendapat folder bernama `siaga-darurat`. Letakkan folder ini di
   tempat yang mudah diingat, misalnya di Desktop.

---

## Bagian 1 — Buat Database Gratis (Neon)

Database ini tempat semua data (akun, order, chat, rating) benar-benar
tersimpan secara permanen.

### 1.1 Daftar di Neon

1. Buka **https://neon.tech**
2. Klik tombol **Sign Up** di pojok kanan atas.
3. Pilih daftar pakai **GitHub** atau **Google** (lebih cepat, tidak perlu
   verifikasi email terpisah).
4. Setelah login, Anda akan diarahkan ke halaman dashboard Neon.

### 1.2 Buat Project Baru

1. Klik tombol **Create a project** (atau **New Project**).
2. Isi:
   - **Project name**: `siaga-darurat` (atau nama lain sesuai keinginan)
   - **Postgres version**: biarkan default (terbaru)
   - **Region**: pilih yang paling dekat, misalnya **Singapore** atau
     **AWS Asia Pacific (Singapore)** — supaya akses dari Indonesia lebih
     cepat.
3. Klik **Create Project**. Tunggu beberapa detik sampai database selesai
   dibuat.

### 1.3 Ambil Connection String

1. Setelah project terbuat, Anda akan melihat halaman **Connection Details**
   atau **Dashboard**.
2. Cari kotak yang judulnya **Connection string**. Isinya akan terlihat
   seperti ini:
   ```
   postgresql://namauser:AbCdEf123456@ep-cool-name-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Klik ikon **copy** di sebelah kotak tersebut untuk menyalin seluruh teks
   ini.
4. **Tempelkan (paste) connection string ini ke Notepad atau catatan
   sementara** — kita akan memakainya beberapa kali di langkah-langkah
   berikutnya. Jangan sampai hilang.

> 💡 **Catatan**: connection string ini seperti "kunci" ke database Anda.
> Jangan dibagikan ke orang lain atau diunggah ke tempat publik (misalnya
> GitHub repository yang sifatnya *public*).

---

## Bagian 2 — Coba Jalankan di Komputer Sendiri (Lokal)

Langkah ini **opsional** tapi sangat disarankan, supaya Anda bisa memastikan
semuanya berjalan dengan baik sebelum di-upload ke internet.

### 2.1 Buka Folder Project di Terminal

**Cara termudah:**
1. Buka folder `siaga-darurat` di File Explorer (Windows) / Finder (Mac).
2. Windows: klik kanan di area kosong dalam folder tersebut → pilih
   **Open in Terminal** atau **Open PowerShell window here**.
   Mac: buka **Terminal**, ketik `cd ` (dengan spasi setelahnya), lalu drag
   folder `siaga-darurat` ke jendela Terminal, lalu tekan Enter.

Pastikan prompt terminal Anda sekarang menunjukkan posisi di dalam folder
`siaga-darurat`. Anda bisa cek dengan mengetik:
```
dir
```
(Windows) atau
```
ls
```
(Mac/Linux) — harusnya muncul daftar file seperti `package.json`,
`server.js`, folder `public`, dll.

### 2.2 Install Semua "Bahan" yang Dibutuhkan

Ketik di terminal:
```
npm install
```
Tunggu sampai proses selesai (biasanya 10-30 detik). Akan muncul folder baru
bernama `node_modules` — itu normal, isinya kode pendukung dari luar.

### 2.3 Buat File `.env`

File ini tempat menyimpan "rahasia" seperti connection string database.

1. Cari file bernama `.env.example` di dalam folder project.
2. **Copy** file tersebut, lalu **rename** hasil copy-nya jadi `.env`
   (tanpa kata "example").
   - Windows: klik kanan `.env.example` → Copy, lalu Paste, lalu rename
     hasilnya jadi `.env`
   - Atau lewat terminal:
     ```
     cp .env.example .env
     ```
3. Buka file `.env` tersebut dengan Notepad atau text editor apa saja.
4. Anda akan melihat isinya seperti ini:
   ```
   DATABASE_URL=postgresql://username:password@ep-xxxxx.region.aws.neon.tech/siaga_darurat?sslmode=require
   JWT_SECRET=ganti-dengan-string-acak-yang-sangat-rahasia
   PORT=3000
   ```
5. **Ganti baris `DATABASE_URL=`** dengan connection string Neon yang sudah
   Anda salin di Bagian 1.3.
6. **Ganti baris `JWT_SECRET=`** dengan teks acak yang panjang. Cara mudah
   membuatnya: ketik di terminal (masih di folder project):
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Akan muncul deretan huruf dan angka acak yang panjang. Salin hasil
   tersebut, lalu tempelkan menggantikan teks
   `ganti-dengan-string-acak-yang-sangat-rahasia` di file `.env`.
7. Simpan file `.env` (Ctrl+S / Cmd+S), lalu tutup.

### 2.4 Buat Semua Tabel di Database

Ketik di terminal:
```
npm run db:init
```
Anda akan melihat output seperti:
```
🚀 Menjalankan 9 statement SQL ke database...
✅ CREATE EXTENSION...
✅ CREATE TABLE...
...
🎉 Selesai! Database siap dipakai.
```
Kalau muncul tulisan **"Selesai"** di baris terakhir, berarti berhasil —
semua tabel (users, orders, chat_messages, ratings, dll) sudah dibuat di
database Neon Anda.

> ⚠️ Kalau muncul error di sini, lihat bagian
> [Troubleshooting](#bagian-8--troubleshooting-kalau-ada-error) di bawah.

### 2.5 Jalankan Server

Ketik di terminal:
```
npm start
```
Anda akan melihat:
```
🚀 Siaga Darurat backend berjalan di http://localhost:3000
```

### 2.6 Buka di Browser

1. Buka browser (Chrome/Firefox/Edge).
2. Ketik alamat: `http://localhost:3000`
3. Harusnya muncul halaman **index.html** dengan tampilan yang sama persis
   seperti file asli Anda.
4. Coba klik **Daftar** sebagai pelanggan, isi form, submit.
5. Kalau berhasil masuk ke `service.html` tanpa error, berarti backend
   sudah benar-benar terhubung ke database.

Untuk menghentikan server, kembali ke terminal lalu tekan `Ctrl + C`.

---

## Bagian 3 — Upload Project ke GitHub

GitHub dibutuhkan karena Vercel mengambil kode dari sana untuk di-deploy.

### 3.1 Buat Repository Baru di GitHub

1. Buka **https://github.com** (pastikan sudah login).
2. Klik tombol **+** di pojok kanan atas → pilih **New repository**.
3. Isi:
   - **Repository name**: `siaga-darurat`
   - **Visibility**: pilih **Private** (disarankan)
4. **Jangan** centang "Add a README file" (supaya tidak bentrok dengan file
   yang sudah ada).
5. Klik **Create repository**.
6. Anda akan melihat halaman instruksi — **biarkan halaman ini terbuka**,
   kita akan memakai perintah dari sana di langkah berikutnya.

### 3.2 Upload Folder Project dari Komputer

Di terminal, pastikan masih berada di dalam folder `siaga-darurat`, lalu
jalankan baris-baris ini **satu per satu** (tekan Enter setelah masing-masing
baris):

```
git init
```
```
git add .
```
```
git commit -m "Initial commit - Siaga Darurat"
```

Selanjutnya, salin 3 baris perintah dari halaman GitHub Anda (ada di bagian
**"…or push an existing repository from the command line"**), biasanya
terlihat seperti ini (tapi dengan username Anda sendiri):

```
git remote add origin https://github.com/USERNAME-ANDA/siaga-darurat.git
git branch -M main
git push -u origin main
```

Jalankan ketiga baris tersebut satu per satu di terminal. Saat diminta
login, masukkan username & password/token GitHub Anda (kalau diminta
**Personal Access Token** bukan password biasa, lihat Bagian 8 di bawah
untuk cara membuatnya).

### 3.3 Pastikan File `.env` TIDAK Ikut Terupload

Ini penting untuk keamanan. File `.gitignore` yang sudah disediakan dalam
project ini **otomatis mencegah** file `.env` ikut terupload ke GitHub.

Untuk memastikan, buka repository Anda di GitHub (refresh halamannya), lalu
cek daftar file — seharusnya **tidak ada file `.env`** di sana (hanya ada
`.env.example`). Kalau `.env` ternyata ikut terupload, hapus dari GitHub dan
segera ganti `JWT_SECRET` serta password database Anda di Neon.

---

## Bagian 4 — Deploy ke Vercel

### 4.1 Daftar di Vercel

1. Buka **https://vercel.com**
2. Klik **Sign Up**.
3. Pilih **Continue with GitHub** (paling mudah, karena nanti Vercel bisa
   langsung mengambil repository Anda).
4. Izinkan akses (klik **Authorize Vercel**) saat diminta.

### 4.2 Import Project

1. Setelah masuk dashboard Vercel, klik **Add New...** → **Project**.
2. Anda akan melihat daftar repository GitHub Anda. Cari **siaga-darurat**,
   klik **Import** di sebelahnya.
   - Kalau repository tidak muncul, klik **Adjust GitHub App Permissions**
     dan pastikan Vercel diizinkan mengakses repository tersebut.

> 💡 **Penting**: project ini sengaja **tidak menyertakan file `vercel.json`**.
> Vercel versi terbaru sudah bisa mendeteksi otomatis project Express +
> folder `public` tanpa konfigurasi tambahan apa pun (disebut "zero-config
> Express on Vercel"). **Jangan menambahkan file `vercel.json` sendiri**
> kecuali Anda benar-benar tahu apa yang diubah — menambahkan properti
> `builds` di `vercel.json` akan membuat Vercel mengabaikan semua
> pengaturan otomatis ini dan sering menyebabkan halaman menampilkan
> **404 Not Found**. Kalau Anda pernah mencoba menambahkan `vercel.json`
> sebelumnya, hapus file tersebut dari repository Anda.

3. Pada langkah **Configure Project**, pastikan **Framework Preset**
   terisi otomatis sebagai **"Other"** (bukan diubah manual ke pilihan
   lain). Biarkan **Build Command**, **Output Directory**, dan
   **Install Command** dalam keadaan default/kosong (toggle **Override**
   tidak perlu dinyalakan).

### 4.3 Atur Environment Variables (WAJIB, jangan dilewat)

Masih di halaman konfigurasi sebelum deploy, cari bagian **Environment
Variables**. Tambahkan dua variabel ini:

| Name | Value |
|---|---|
| `DATABASE_URL` | connection string Neon Anda (yang sama seperti di Bagian 1.3) |
| `JWT_SECRET` | string acak yang sama seperti yang Anda buat di Bagian 2.3 |

Caranya:
1. Di kolom **Name**, ketik `DATABASE_URL`.
2. Di kolom **Value**, paste connection string Neon Anda.
3. Klik **Add**.
4. Ulangi untuk `JWT_SECRET` dengan value string acak Anda.

### 4.4 Klik Deploy

1. Klik tombol **Deploy**.
2. Tunggu 1-3 menit. Anda akan melihat log proses build berjalan.
3. Setelah selesai, akan muncul halaman dengan tulisan besar
   **"Congratulations!"** beserta tampilan preview website Anda.
4. Klik tombol **Visit** untuk melihat alamat website Anda — bentuknya
   seperti:
   ```
   https://siaga-darurat-xxxxx.vercel.app
   ```
5. **Catat/simpan alamat ini** — inilah alamat yang bisa dibuka siapa saja.

---

## Bagian 5 — Buat Tabel di Database Production

> ⚠️ **Jangan lewatkan bagian ini.** Tanpa langkah ini, website yang sudah
> online akan error saat ada yang mencoba daftar/login, karena tabel di
> database belum dibuat.

Kabar baiknya: kalau Anda sudah menjalankan **Bagian 2.4** (`npm run db:init`)
sebelumnya dengan `DATABASE_URL` Neon yang sama, **tabel sudah otomatis ada**
juga untuk versi Vercel — karena keduanya memakai database Neon yang sama
persis. Anda tidak perlu mengulang apa pun, langsung lanjut ke Bagian 6.

Tapi kalau Anda **melewati Bagian 2** (langsung loncat ke deploy Vercel
tanpa pernah menjalankan `npm run db:init` di komputer), lakukan ini sekarang:

1. Buka terminal, masuk ke folder `siaga-darurat` (sama seperti Bagian 2.1).
2. Pastikan file `.env` sudah ada dan `DATABASE_URL` sudah diisi connection
   string Neon (ikuti Bagian 2.3 kalau belum).
3. Jalankan:
   ```
   npm install
   npm run db:init
   ```
4. Tunggu sampai muncul **"🎉 Selesai! Database siap dipakai."**

---

## Bagian 6 — Tes Website yang Sudah Online

1. Buka alamat Vercel Anda di browser.
2. Pastikan tampilan halaman utama muncul dengan benar (sama seperti file
   asli Anda).
3. **Tes sebagai pelanggan:**
   - Klik tombol untuk daftar/masuk sebagai pelanggan.
   - Isi form pendaftaran dengan data baru (nama, email, password minimal
     8 karakter).
   - Submit — harusnya langsung masuk ke halaman `service.html`.
   - Coba minta bantuan (pilih salah satu layanan, misalnya "Kendaraan
     Mogok"), isi catatan, lalu submit order.
4. **Tes sebagai teknisi** (buka di browser/device lain, atau mode
   Incognito supaya tidak tercampur sesi pelanggan):
   - Daftar sebagai teknisi lewat halaman index.
   - Masuk ke `teknisi.html`, buka menu **Pesanan Masuk**.
   - Dalam beberapa detik (polling tiap 4 detik), order yang dibuat
     pelanggan di langkah 3 seharusnya muncul sebagai kartu baru.
   - Klik **Terima** — order tersebut sekarang terikat ke akun teknisi ini.
5. Kalau kedua langkah di atas berhasil tanpa error, berarti seluruh sistem
   (database, backend, dan front-end) sudah terhubung dengan benar.

---

## Bagian 7 — Hal Penting yang Perlu Diketahui

- **Satu alamat untuk semua halaman**: setelah deploy, `index.html`,
  `service.html`, dan `teknisi.html` semuanya bisa diakses dari domain
  Vercel yang sama, dan otomatis tersambung ke API yang sama. Tidak perlu
  konfigurasi tambahan.
- **Login teknisi**: form di index.html memang hanya punya "Daftar" untuk
  teknisi (sesuai desain aslinya). Kalau teknisi yang sudah punya akun
  mengisi form daftar lagi dengan email & password yang sama, sistem akan
  otomatis login-kan dia.
- **Tetap bisa dicoba tanpa login**: kalau seseorang membuka `service.html`
  atau `teknisi.html` langsung tanpa mendaftar dulu, semua animasi/simulasi
  visual tetap berjalan seperti biasa — hanya saja data tidak tersimpan ke
  server selama belum login.
- **Update otomatis**: setiap kali Anda mengubah kode dan melakukan
  `git push` ke GitHub, Vercel akan **otomatis** mem-build ulang dan
  mem-publish versi terbaru.
- **Biaya**: Vercel free tier dan Neon free tier cukup untuk skripsi, demo,
  atau trafik kecil-menengah. Tidak perlu kartu kredit untuk mulai.
- **Kecepatan real-time**: karena memakai polling (bukan WebSocket), ada
  jeda sekitar 3-5 detik sebelum perubahan dari satu sisi terlihat di sisi
  lain. Ini wajar, karena Vercel (serverless) tidak mendukung koneksi
  WebSocket yang terus-menerus terbuka.

---

## Bagian 8 — Troubleshooting (Kalau Ada Error)

**Muncul peringatan "Karena adanya `builds` dalam file konfigurasi Anda,
Pengaturan Build dan Pengembangan... tidak akan berlaku", DAN/ATAU halaman
website menampilkan 404 Not Found setelah deploy:**
- Ini terjadi kalau ada file **`vercel.json`** di project Anda yang berisi
  properti `builds`. Project ini sengaja dirancang **tanpa** `vercel.json`
  sama sekali (lihat catatan di Bagian 4.2) — Vercel sudah otomatis
  mengenali struktur `server.js` (Express) + folder `public` (file statis).
- **Cara memperbaiki:**
  1. Buka project Anda di komputer (folder `siaga-darurat`).
  2. Pastikan **tidak ada file bernama `vercel.json`** di folder paling
     atas. Kalau ada (misalnya dari percobaan sebelumnya), hapus file
     tersebut.
  3. Pastikan juga tidak ada folder bernama `api` di tingkat paling atas
     project (kalau ada sisa dari percobaan lama, hapus foldernya).
  4. Simpan perubahan, lalu upload ulang ke GitHub:
     ```
     git add .
     git commit -m "Hapus vercel.json, pakai zero-config"
     git push
     ```
  5. Vercel akan otomatis mem-build ulang dalam 1-2 menit. Setelah selesai,
     coba buka alamat website Anda lagi.
- Kalau peringatan/404 masih muncul setelah langkah di atas, kemungkinan
  **Project Settings** di dashboard Vercel masih menyimpan pengaturan lama.
  Buka Vercel Dashboard → project Anda → **Settings** → **General** →
  bagian **Build & Development Settings** → pastikan **Framework Preset**
  diatur ke **"Other"** dan toggle **Override** dalam keadaan **mati**
  (tidak menyala) untuk Build Command, Output Directory, dan Install
  Command. Simpan, lalu **Redeploy** dari tab **Deployments**.

**Error saat `npm install`:**
- Pastikan Node.js sudah terinstall (`node --version` harus muncul nomor
  versi). Kalau belum, ulangi Bagian 0.1.

**Error saat `npm run db:init`, tulisannya mengandung "ENOTFOUND" atau
"connection refused":**
- Cek lagi isi file `.env`, pastikan `DATABASE_URL` benar-benar disalin
  utuh dari Neon (termasuk bagian `?sslmode=require` di akhir).
- Pastikan tidak ada spasi tambahan sebelum/sesudah connection string.

**Error "password authentication failed" saat `db:init`:**
- Connection string mungkin salah disalin. Kembali ke Neon Dashboard →
  Connection Details → salin ulang, lalu ganti isi `.env`.

**Website Vercel menampilkan error 500 / "Internal Server Error" saat
mencoba daftar/login:**
- Kemungkinan besar `DATABASE_URL` atau `JWT_SECRET` belum diisi dengan
  benar di Vercel. Buka Vercel Dashboard → pilih project Anda → tab
  **Settings** → **Environment Variables** → pastikan kedua variabel ada
  dan isinya benar. Setelah mengubah, klik tab **Deployments** → titik tiga
  (⋯) di deployment terbaru → **Redeploy**.
- Pastikan juga Bagian 5 (buat tabel) sudah dijalankan dengan
  `DATABASE_URL` Neon yang **sama** dengan yang dipakai di Vercel.

**Tampilan halaman jadi rusak/berantakan saat diakses online (padahal di
lokal normal):**
- Cek koneksi internet Anda — halaman ini memuat beberapa file dari CDN
  luar (Tailwind CSS, Leaflet, Google Fonts), jadi butuh koneksi internet
  aktif saat dibuka, baik versi lokal maupun online.

**`git push` minta password tapi ditolak terus:**
- GitHub sekarang tidak menerima password akun biasa untuk `git push` lewat
  terminal. Anda perlu membuat **Personal Access Token**: buka GitHub →
  klik foto profil → **Settings** → scroll ke bawah ke **Developer settings**
  → **Personal access tokens** → **Tokens (classic)** → **Generate new
  token** → centang `repo` → **Generate token** → salin token tersebut, lalu
  pakai token ini sebagai "password" saat `git push` meminta login.

**Order dari pelanggan tidak muncul di "Pesanan Masuk" teknisi:**
- Tunggu beberapa detik (sistem memeriksa server setiap 4 detik, bukan
  instan).
- Pastikan kedua akun (pelanggan & teknisi) benar-benar sudah login/daftar
  (bukan mencoba tanpa login).
- Coba refresh halaman `teknisi.html`.

---

## Lampiran — Daftar Endpoint API

```
GET  /api/health                        → cek server hidup
POST /api/auth/register                  → { role, firstName, lastName, email, phone, password, speciality?, city? }
POST /api/auth/login                      → { email, password, role? }
GET  /api/auth/me                          → data akun yang sedang login (butuh token)

POST /api/orders                           → buat order baru (role: pelanggan)
GET  /api/orders/pending                    → daftar order yang masih mencari teknisi (role: teknisi)
GET  /api/orders/active                      → order aktif milik akun yang login (untuk polling)
GET  /api/orders/:id                          → detail 1 order
POST /api/orders/:id/accept                    → teknisi menerima order
POST /api/orders/:id/reject                     → teknisi melewati order
PATCH /api/orders/:id/state                      → ubah status order
POST /api/orders/:id/location                     → kirim update lokasi GPS
GET  /api/orders/:id/messages                      → ambil riwayat chat
POST /api/orders/:id/messages                       → kirim pesan chat

POST /api/ratings                                    → kirim rating
GET  /api/ratings/me                                  → daftar ulasan untuk teknisi yang login

GET  /api/bank                                         → daftar rekening teknisi yang login
POST /api/bank                                          → tambah rekening
DELETE /api/bank/:id                                     → hapus rekening
POST /api/bank/withdraw                                   → ajukan tarik dana
```

Semua endpoint (kecuali `/api/health`, `/api/auth/register`, dan
`/api/auth/login`) butuh header berikut, berisi token yang didapat saat
login/daftar:
```
Authorization: Bearer <token>
```

Selamat mencoba! 🚗🔧
