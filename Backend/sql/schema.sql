-- AWAAZ database schema (idempotent — safe to run on every boot)

CREATE SEQUENCE IF NOT EXISTS awaaz_complaint_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS departments (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS complaints (
  id            BIGSERIAL PRIMARY KEY,
  -- Human-friendly public ID: AWZ-0001, AWZ-0002 ... (internal id is never exposed)
  public_id     TEXT NOT NULL UNIQUE
                DEFAULT ('AWZ-' || lpad(nextval('awaaz_complaint_seq')::text, 4, '0')),
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,                 -- AI-generated clean complaint
  original_text TEXT NOT NULL,                 -- exactly what the citizen sent
  language      TEXT NOT NULL DEFAULT 'en',
  sector        TEXT NOT NULL,                 -- display form, e.g. "Sector 22"
  sector_key    TEXT NOT NULL,                 -- normalized form, e.g. "sector-22"
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  photo_url     TEXT,
  priority      TEXT NOT NULL CHECK (priority IN ('HIGH','MEDIUM','LOW')),
  priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  department    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'REPORTED'
                CHECK (status IN ('REPORTED','ASSIGNED','RESOLVED')),
  report_count  INTEGER NOT NULL DEFAULT 1 CHECK (report_count >= 1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS status_history (
  id           BIGSERIAL PRIMARY KEY,
  complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  status       TEXT NOT NULL CHECK (status IN ('REPORTED','ASSIGNED','RESOLVED')),
  changed_by   TEXT NOT NULL DEFAULT 'system',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Required indexes
CREATE INDEX IF NOT EXISTS idx_complaints_category   ON complaints (category);
CREATE INDEX IF NOT EXISTS idx_complaints_sector     ON complaints (sector);
CREATE INDEX IF NOT EXISTS idx_complaints_sector_key ON complaints (sector_key);
CREATE INDEX IF NOT EXISTS idx_complaints_status     ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints (department);
CREATE INDEX IF NOT EXISTS idx_complaints_priority   ON complaints (priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON status_history (complaint_id);

-- Duplicate protection AT THE DATABASE LEVEL:
-- at most ONE open (non-RESOLVED) complaint per (category, sector).
-- Even two simultaneous requests cannot create duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS uq_open_complaint_category_sector
  ON complaints (category, sector_key)
  WHERE status <> 'RESOLVED';