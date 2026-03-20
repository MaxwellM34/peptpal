import { Platform } from 'react-native';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

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
