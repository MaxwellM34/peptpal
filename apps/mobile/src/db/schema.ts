/**
 * Local SQLite schema definitions and migration runner.
 * Personal user data — never leaves the device.
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS peptides_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  peptide_ref_id   INTEGER NOT NULL,
  peptide_name     TEXT NOT NULL,
  injected_at      TEXT NOT NULL,
  dose_mcg         REAL NOT NULL,
  dose_ml          REAL,
  injection_site   TEXT,
  notes            TEXT,
  inventory_id     INTEGER,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at       TEXT
);

CREATE TABLE IF NOT EXISTS symptoms_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  peptide_log_id   INTEGER REFERENCES peptides_log(id) ON DELETE SET NULL,
  symptom          TEXT NOT NULL,
  severity         INTEGER NOT NULL CHECK(severity >= 1 AND severity <= 10),
  occurred_at      TEXT NOT NULL,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at       TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  peptide_ref_id   INTEGER NOT NULL,
  peptide_name     TEXT NOT NULL,
  frequency_hours  REAL,
  dose_mcg         REAL NOT NULL,
  start_date       TEXT NOT NULL,
  end_date         TEXT,
  reminder_enabled INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at       TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  peptide_ref_id          INTEGER NOT NULL,
  peptide_name            TEXT NOT NULL,
  vial_count              INTEGER NOT NULL DEFAULT 1,
  vial_size_mg            REAL NOT NULL,
  reconstituted           INTEGER NOT NULL DEFAULT 0,
  bac_water_added_ml      REAL,
  concentration_mcg_per_ml REAL,
  opened_at               TEXT,
  expiry_at               TEXT,
  storage_location        TEXT NOT NULL DEFAULT 'fridge',
  notes                   TEXT,
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at              TEXT
);

CREATE TABLE IF NOT EXISTS reminders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  next_fire_at TEXT NOT NULL,
  sent        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS peptide_cache (
  slug        TEXT PRIMARY KEY,
  data        TEXT NOT NULL,
  fetched_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_peptides_log_injected_at ON peptides_log(injected_at);
CREATE INDEX IF NOT EXISTS idx_peptides_log_peptide_ref_id ON peptides_log(peptide_ref_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_log_occurred_at ON symptoms_log(occurred_at);
CREATE INDEX IF NOT EXISTS idx_inventory_peptide_ref_id ON inventory(peptide_ref_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next_fire ON reminders(next_fire_at, sent);
`;
