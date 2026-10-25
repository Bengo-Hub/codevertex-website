-- Codevertex Website Database Schema
-- Run: psql $DATABASE_URL -f scripts/schema.sql

CREATE TABLE IF NOT EXISTS contact_submissions (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  service     TEXT,
  message     TEXT NOT NULL,
  source      TEXT DEFAULT 'website',
  notice_sent_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  topic       TEXT,
  preferred_time TEXT,
  source      TEXT DEFAULT 'chatbot',
  notes       TEXT,
  status      TEXT DEFAULT 'new',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at DESC);
