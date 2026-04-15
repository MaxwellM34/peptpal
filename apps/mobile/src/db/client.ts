import { Platform } from 'react-native';
import { CREATE_TABLES_SQL, SCHEMA_VERSION, MIGRATIONS_V1_TO_V2 } from './schema';

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
  await database.execAsync(CREATE_TABLES_SQL);
  const row = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1',
  );
  if (!row) {
    await database.runAsync('INSERT INTO schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
    return;
  }

  if (row.version < 2) {
    for (const stmt of MIGRATIONS_V1_TO_V2) {
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
    await database.runAsync('UPDATE schema_version SET version = ?', [SCHEMA_VERSION]);
  }
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
