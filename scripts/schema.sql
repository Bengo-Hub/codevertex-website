-- Codevertex Website Database Schema
-- Run: psql $DATABASE_URL -f scripts/schema.sql

-- Leads and contact enquiries live in MarketFlow (src/lib/marketflow.ts), not here.

CREATE TABLE IF NOT EXISTS enrollments (
  id              BIGSERIAL PRIMARY KEY,
  course_id       TEXT NOT NULL,
  course_name     TEXT NOT NULL,
  category        TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  dob             DATE,
  experience      TEXT,
  how_heard       TEXT,
  amount          INTEGER NOT NULL,
  currency        TEXT DEFAULT 'KES',
  payment_ref     TEXT,
  payment_status  TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_email ON enrollments(email);
