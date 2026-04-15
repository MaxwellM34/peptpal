import { Platform } from 'react-native';
import {
  CREATE_TABLES_SQL,
  CREATE_INDEXES_SQL,
  SCHEMA_VERSION,
  MIGRATIONS_V1_TO_V2,
  MIGRATIONS_V2_TO_V3,
} from './schema';

// expo-sqlite is native-only — not available in the browser
const isWeb = Platform.OS === 'web';

type AnyDb = import('expo-sqlite').SQLiteDatabase;
let db: AnyDb | null = null;

export async function getDb(): Promise<AnyDb> {
  if (isWeb) throw new Error('SQLite is not supported on web');
  if (db) return db;

  const SQLite = await import('expo-sqlite');
  db = await SQLite.openDatabaseAsync('peptpal.db');
  await initDb(db);
  return db;
}

async function initDb(database: AnyDb): Promise<void> {
  // Phase 1: tables only. Indexes referencing migration-added columns must wait.
  await database.execAsync(CREATE_TABLES_SQL);

  const row = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
  );

  async function runMigration(stmts: string[]) {
    for (const stmt of stmts) {
      try {
        await database.execAsync(stmt);
      } catch (e) {
        // ALTER TABLE ADD COLUMN fails with "duplicate column" if the column
        // already exists (e.g. fresh install ran CREATE_TABLES_SQL first).
        const msg = String(e);
        if (!msg.includes('duplicate column') && !msg.includes('already exists')) {
          throw e;
        }
      }
    }
  }

  if (!row) {
    await database.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
  } else {
    // Phase 2: migrations bring existing schemas up to current.
    if (row.version < 2) await runMigration(MIGRATIONS_V1_TO_V2);
    if (row.version < 3) await runMigration(MIGRATIONS_V2_TO_V3);

    if (row.version < SCHEMA_VERSION) {
      await database.runAsync('UPDATE schema_version SET version = ?', [SCHEMA_VERSION]);
    }
  }

  // Phase 3: indexes (now that all columns exist).
  await database.execAsync(CREATE_INDEXES_SQL);
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/** Returns true on platforms where local storage is available */
export function isDbAvailable(): boolean {
  return !isWeb;
}
