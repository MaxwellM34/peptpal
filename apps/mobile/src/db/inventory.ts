import { getDb, isDbAvailable } from './client';
import type { InventoryItem } from '@peptpal/core';

export interface CreateInventoryInput {
  peptide_ref_id: number;
  peptide_name: string;
  vial_count: number;
  vial_size_mg: number;
  reconstituted?: boolean;
  bac_water_added_ml?: number | null;
  concentration_mcg_per_ml?: number | null;
  opened_at?: string | null;
  expiry_at?: string | null;
  storage_location?: 'fridge' | 'freezer';
  vendor?: string | null;
  batch_number?: string | null;
  coa_url?: string | null;
  coa_purity_percent?: number | null;
  counterfeit_flagged?: boolean;
  notes?: string | null;
}

export interface InventoryItemExtended extends InventoryItem {
  vendor: string | null;
  batch_number: string | null;
  coa_url: string | null;
  coa_purity_percent: number | null;
  counterfeit_flagged: boolean;
}

export async function createInventoryItem(input: CreateInventoryInput): Promise<number> {
  if (!isDbAvailable()) return 0;
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO inventory
      (peptide_ref_id, peptide_name, vial_count, vial_size_mg, reconstituted,
       bac_water_added_ml, concentration_mcg_per_ml, opened_at, expiry_at,
       storage_location, vendor, batch_number, coa_url, coa_purity_percent,
       counterfeit_flagged, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.peptide_ref_id,
      input.peptide_name,
      input.vial_count,
      input.vial_size_mg,
      input.reconstituted ? 1 : 0,
      input.bac_water_added_ml ?? null,
      input.concentration_mcg_per_ml ?? null,
      input.opened_at ?? null,
      input.expiry_at ?? null,
      input.storage_location ?? 'fridge',
      input.vendor ?? null,
      input.batch_number ?? null,
      input.coa_url ?? null,
      input.coa_purity_percent ?? null,
      input.counterfeit_flagged ? 1 : 0,
      input.notes ?? null,
    ],
  );
  return result.lastInsertRowId;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (!isDbAvailable()) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<Omit<InventoryItem, 'reconstituted'> & { reconstituted: number }>(
    'SELECT * FROM inventory WHERE deleted_at IS NULL ORDER BY created_at DESC',
  );
  return rows.map((r) => ({ ...r, reconstituted: Boolean(r.reconstituted) }));
}

export async function getInventoryItemById(id: number): Promise<InventoryItem | null> {
  if (!isDbAvailable()) return null;
  const db = await getDb();
  const row = await db.getFirstAsync<Omit<InventoryItem, 'reconstituted'> & { reconstituted: number }>(
    'SELECT * FROM inventory WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  if (!row) return null;
  return { ...row, reconstituted: Boolean(row.reconstituted) };
}

export async function updateInventoryItem(
  id: number,
  updates: Partial<CreateInventoryInput>,
): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  const fields = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  const values = Object.values(updates).map((v) =>
    typeof v === 'boolean' ? (v ? 1 : 0) : (v ?? null),
  );
  await db.runAsync(`UPDATE inventory SET ${fields} WHERE id = ?`, [...values, id]);
}

export async function softDeleteInventoryItem(id: number): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(
    "UPDATE inventory SET deleted_at = datetime('now') WHERE id = ?",
    [id],
  );
}

export async function decrementVialCount(id: number): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(
    'UPDATE inventory SET vial_count = MAX(0, vial_count - 1) WHERE id = ?',
    [id],
  );
}
