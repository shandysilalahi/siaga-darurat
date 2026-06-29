-- ============================================================
-- SIAGA DARURAT — DATABASE SCHEMA (PostgreSQL / Neon)
-- ============================================================
-- Jalankan file ini sekali di Neon SQL Editor (atau lewat
-- `npm run db:init`) untuk membuat semua tabel yang dibutuhkan.
-- Aman dijalankan berulang kali karena memakai IF NOT EXISTS.
-- ============================================================

-- Ekstensi untuk UUID (Neon biasanya sudah mengaktifkan ini)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── USERS (Pelanggan & Teknisi dalam satu tabel, dibedakan oleh `role`) ──
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          TEXT NOT NULL CHECK (role IN ('pelanggan', 'teknisi')),
  first_name    TEXT NOT NULL,
  last_name     TEXT DEFAULT '',
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,

  -- Kolom khusus teknisi (NULL untuk pelanggan)
  speciality    TEXT,
  city          TEXT,
  vehicle       TEXT DEFAULT 'Honda Vario',
  is_online     BOOLEAN DEFAULT TRUE,
  rating_avg    NUMERIC(2,1) DEFAULT 5.0,
  rating_count  INTEGER DEFAULT 0,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── ORDERS (pesanan bantuan kendaraan) ──
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technician_id    UUID REFERENCES users(id) ON DELETE SET NULL,

  service_key      TEXT NOT NULL,        -- contoh: 'mogok', 'ban', 'aki', dst
  service_title    TEXT NOT NULL,
  notes            TEXT DEFAULT '',

  state            TEXT NOT NULL DEFAULT 'SEARCHING_TECHNICIAN',
  -- Nilai state mengikuti state machine front-end:
  -- SEARCHING_TECHNICIAN, TECHNICIAN_FOUND, TECHNICIAN_ACCEPTED,
  -- TECHNICIAN_ON_THE_WAY, TECHNICIAN_ARRIVED, SERVICE_IN_PROGRESS,
  -- SERVICE_COMPLETED, ORDER_CANCELLED

  customer_lat     DOUBLE PRECISION,
  customer_lng     DOUBLE PRECISION,
  customer_address TEXT,

  technician_lat   DOUBLE PRECISION,
  technician_lng   DOUBLE PRECISION,

  distance_km      NUMERIC(6,2) DEFAULT 0,
  eta_minutes       NUMERIC(6,2) DEFAULT 0,

  cost             INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,

  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_technician ON orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_state ON orders(state);

-- ── CHAT MESSAGES (per order) ──
CREATE TABLE IF NOT EXISTS chat_messages (
  id          BIGSERIAL PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender      TEXT NOT NULL CHECK (sender IN ('pelanggan', 'teknisi')),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_order ON chat_messages(order_id);

-- ── RATINGS (ulasan pelanggan untuk teknisi) ──
CREATE TABLE IF NOT EXISTS ratings (
  id            BIGSERIAL PRIMARY KEY,
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars         INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment       TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ratings_technician ON ratings(technician_id);

-- ── REKENING TEKNISI (untuk fitur tarik dana) ──
CREATE TABLE IF NOT EXISTS bank_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method        TEXT NOT NULL,      -- contoh: 'BCA', 'DANA', 'GoPay', dst
  account_name  TEXT NOT NULL,
  account_number TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_technician ON bank_accounts(technician_id);

-- ── WITHDRAWALS (riwayat tarik dana, opsional tapi berguna) ──
CREATE TABLE IF NOT EXISTS withdrawals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  amount        INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
