import { getDb, isDbAvailable } from './client';
import type { BiomarkerKey } from '@peptpal/core';

export interface BiomarkerRow {
  id: number;
  biomarker_key: BiomarkerKey;
  value: number;
  measured_at: string;
  notes: string | null;
}

export async function createBiomarkerReading(input: {
  biomarker_key: BiomarkerKey;
  value: number;
  measured_at: string;
  notes?: string | null;
}): Promise<number> {
  if (!isDbAvailable()) return 0;
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO biomarker_readings (biomarker_key, value, measured_at, notes)
     VALUES (?, ?, ?, ?)`,
    [input.biomarker_key, input.value, input.measured_at, input.notes ?? null],
  );
  return result.lastInsertRowId;
}

export async function getBiomarkerReadings(key?: BiomarkerKey): Promise<BiomarkerRow[]> {
  if (!isDbAvailable()) return [];
  const db = await getDb();
  if (key) {
    return db.getAllAsync<BiomarkerRow>(
      `SELECT id, biomarker_key, value, measured_at, notes
       FROM biomarker_readings
       WHERE deleted_at IS NULL AND biomarker_key = ?
       ORDER BY measured_at ASC`,
      [key],
    );
  }
  return db.getAllAsync<BiomarkerRow>(
    `SELECT id, biomarker_key, value, measured_at, notes
     FROM biomarker_readings
     WHERE deleted_at IS NULL
     ORDER BY measured_at DESC`,
  );
}

export async function deleteBiomarkerReading(id: number): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(
    "UPDATE biomarker_readings SET deleted_at = datetime('now') WHERE id = ?",
    [id],
  );
}
