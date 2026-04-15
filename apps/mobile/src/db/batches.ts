import { getDb, isDbAvailable } from './client';

export interface BatchRow {
  id: number;
  vendor: string | null;
  received_at: string;
  notes: string | null;
  photos_json: string | null;
  created_at: string;
}

export interface CreateBatchInput {
  vendor?: string | null;
  received_at: string;
  notes?: string | null;
  photo_paths?: string[];
}

export async function createBatch(input: CreateBatchInput): Promise<number> {
  if (!isDbAvailable()) return 0;
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO batches (vendor, received_at, notes, photos_json)
     VALUES (?, ?, ?, ?)`,
    [
      input.vendor ?? null,
      input.received_at,
      input.notes ?? null,
      input.photo_paths ? JSON.stringify(input.photo_paths) : null,
    ],
  );
  return result.lastInsertRowId;
}

export async function getBatch(id: number): Promise<BatchRow | null> {
  if (!isDbAvailable()) return null;
  const db = await getDb();
  return db.getFirstAsync<BatchRow>(
    `SELECT * FROM batches WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
}

export async function listBatches(): Promise<BatchRow[]> {
  if (!isDbAvailable()) return [];
  const db = await getDb();
  return db.getAllAsync<BatchRow>(
    `SELECT * FROM batches WHERE deleted_at IS NULL ORDER BY received_at DESC`,
  );
}

export function parsePhotos(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Next label number for a peptide — 1-indexed per peptide_ref_id. */
export async function nextLabelNumber(peptide_ref_id: number): Promise<number> {
  if (!isDbAvailable()) return 1;
  const db = await getDb();
  const row = await db.getFirstAsync<{ max_n: number | null }>(
    `SELECT MAX(label_number) as max_n FROM inventory WHERE peptide_ref_id = ?`,
    [peptide_ref_id],
  );
  return (row?.max_n ?? 0) + 1;
}
