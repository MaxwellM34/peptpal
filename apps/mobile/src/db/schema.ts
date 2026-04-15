/**
 * Local SQLite schema definitions and migration runner.
 * Personal user data — never leaves the device.
 */

export const SCHEMA_VERSION = 3;

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
  ae_nausea        INTEGER,
  ae_fatigue       INTEGER,
  ae_injection_site INTEGER,
  ae_mood          INTEGER,
  ae_other         TEXT,
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
  vendor                  TEXT,
  batch_number            TEXT,
  coa_url                 TEXT,
  coa_purity_percent      REAL,
  counterfeit_flagged     INTEGER NOT NULL DEFAULT 0,
  batch_id                INTEGER,
  label_number            INTEGER,
  photos_json             TEXT,
  received_at             TEXT,
  notes                   TEXT,
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at              TEXT
);

CREATE TABLE IF NOT EXISTS batches (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor         TEXT,
  received_at    TEXT NOT NULL,
  notes          TEXT,
  photos_json    TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at     TEXT
);

CREATE TABLE IF NOT EXISTS protocols (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  goal           TEXT,
  active         INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at     TEXT
);

CREATE TABLE IF NOT EXISTS protocol_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol_id      INTEGER NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  peptide_ref_id   INTEGER NOT NULL,
  peptide_name     TEXT NOT NULL,
  peptide_slug     TEXT,
  dose_mcg         REAL NOT NULL,
  doses_per_week   REAL NOT NULL DEFAULT 7,
  target_volume_ml REAL NOT NULL DEFAULT 0.10,
  notes            TEXT
);

CREATE TABLE IF NOT EXISTS tutorial_state (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  completed     INTEGER NOT NULL DEFAULT 0,
  last_step     INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
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

CREATE TABLE IF NOT EXISTS user_profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  weight_kg       REAL,
  height_cm       REAL,
  age             INTEGER,
  sex             TEXT,
  primary_goal    TEXT,
  activity_level  TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS biomarker_readings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  biomarker_key TEXT NOT NULL,
  value         REAL NOT NULL,
  measured_at   TEXT NOT NULL,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at    TEXT
);

`;

/**
 * Indexes are created separately from CREATE_TABLES_SQL.
 *
 * Why: CREATE INDEX validates that the column exists. If a new migration
 * adds a column (e.g. batch_id), and we put the corresponding index in the
 * shared CREATE_TABLES_SQL, existing databases will fail the index statement
 * before migrations have had a chance to add the column.
 *
 * Order in initDb: tables → migrations → indexes.
 */
export const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_peptides_log_injected_at ON peptides_log(injected_at);
CREATE INDEX IF NOT EXISTS idx_peptides_log_peptide_ref_id ON peptides_log(peptide_ref_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_log_occurred_at ON symptoms_log(occurred_at);
CREATE INDEX IF NOT EXISTS idx_inventory_peptide_ref_id ON inventory(peptide_ref_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next_fire ON reminders(next_fire_at, sent);
CREATE INDEX IF NOT EXISTS idx_biomarker_key_time ON biomarker_readings(biomarker_key, measured_at);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_id ON inventory(batch_id);
CREATE INDEX IF NOT EXISTS idx_protocol_items_protocol_id ON protocol_items(protocol_id);
`;

/**
 * Incremental migrations from v1 → v2. Run in sequence; each must be idempotent.
 * We use ALTER TABLE ADD COLUMN which is safe if the column doesn't exist;
 * we catch the "duplicate column" error since SQLite has no IF NOT EXISTS for columns.
 */
export const MIGRATIONS_V2_TO_V3: string[] = [
  `CREATE TABLE IF NOT EXISTS batches (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     vendor TEXT,
     received_at TEXT NOT NULL,
     notes TEXT,
     photos_json TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     deleted_at TEXT
   )`,
  `ALTER TABLE inventory ADD COLUMN batch_id INTEGER`,
  `ALTER TABLE inventory ADD COLUMN label_number INTEGER`,
  `ALTER TABLE inventory ADD COLUMN photos_json TEXT`,
  `ALTER TABLE inventory ADD COLUMN received_at TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_batch_id ON inventory(batch_id)`,
  `CREATE TABLE IF NOT EXISTS protocols (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     goal TEXT,
     active INTEGER NOT NULL DEFAULT 1,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     deleted_at TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS protocol_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     protocol_id INTEGER NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
     peptide_ref_id INTEGER NOT NULL,
     peptide_name TEXT NOT NULL,
     peptide_slug TEXT,
     dose_mcg REAL NOT NULL,
     doses_per_week REAL NOT NULL DEFAULT 7,
     target_volume_ml REAL NOT NULL DEFAULT 0.10,
     notes TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_protocol_items_protocol_id ON protocol_items(protocol_id)`,
  `CREATE TABLE IF NOT EXISTS tutorial_state (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     completed INTEGER NOT NULL DEFAULT 0,
     last_step INTEGER NOT NULL DEFAULT 0,
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
];

export const MIGRATIONS_V1_TO_V2: string[] = [
  `ALTER TABLE peptides_log ADD COLUMN ae_nausea INTEGER`,
  `ALTER TABLE peptides_log ADD COLUMN ae_fatigue INTEGER`,
  `ALTER TABLE peptides_log ADD COLUMN ae_injection_site INTEGER`,
  `ALTER TABLE peptides_log ADD COLUMN ae_mood INTEGER`,
  `ALTER TABLE peptides_log ADD COLUMN ae_other TEXT`,
  `ALTER TABLE inventory ADD COLUMN vendor TEXT`,
  `ALTER TABLE inventory ADD COLUMN batch_number TEXT`,
  `ALTER TABLE inventory ADD COLUMN coa_url TEXT`,
  `ALTER TABLE inventory ADD COLUMN coa_purity_percent REAL`,
  `ALTER TABLE inventory ADD COLUMN counterfeit_flagged INTEGER NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS user_profile (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     weight_kg REAL,
     height_cm REAL,
     age INTEGER,
     sex TEXT,
     primary_goal TEXT,
     activity_level TEXT,
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE TABLE IF NOT EXISTS biomarker_readings (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     biomarker_key TEXT NOT NULL,
     value REAL NOT NULL,
     measured_at TEXT NOT NULL,
     notes TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     deleted_at TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_biomarker_key_time ON biomarker_readings(biomarker_key, measured_at)`,
];
