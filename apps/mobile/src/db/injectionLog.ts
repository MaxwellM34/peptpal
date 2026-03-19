import { getDb } from './client';
import type { InjectionLog } from '@peptpal/core';

export interface CreateInjectionLogInput {
  peptide_ref_id: number;
  peptide_name: string;
  injected_at: string;
  dose_mcg: number;
  dose_ml?: number | null;
  injection_site?: string | null;
  notes?: string | null;
  inventory_id?: number | null;
}

export async function createInjectionLog(input: CreateInjectionLogInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO peptides_log
      (peptide_ref_id, peptide_name, injected_at, dose_mcg, dose_ml, injection_site, notes, inventory_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.peptide_ref_id,
      input.peptide_name,
      input.injected_at,
      input.dose_mcg,
      input.dose_ml ?? null,
      input.injection_site ?? null,
      input.notes ?? null,
      input.inventory_id ?? null,
    ],
  );
  return result.lastInsertRowId;
}

export async function getInjectionLogs(opts?: {
  peptide_ref_id?: number;
  since?: string;
  until?: string;
  limit?: number;
}): Promise<InjectionLog[]> {
  const db = await getDb();
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: (string | number)[] = [];

  if (opts?.peptide_ref_id != null) {
    conditions.push('peptide_ref_id = ?');
    params.push(opts.peptide_ref_id);
  }
  if (opts?.since) {
    conditions.push('injected_at >= ?');
    params.push(opts.since);
  }
  if (opts?.until) {
    conditions.push('injected_at <= ?');
    params.push(opts.until);
  }

  const where = conditions.join(' AND ');
  const limit = opts?.limit ? `LIMIT ${opts.limit}` : '';
  const rows = await db.getAllAsync<InjectionLog>(
    `SELECT * FROM peptides_log WHERE ${where} ORDER BY injected_at DESC ${limit}`,
    params,
  );
  return rows;
}

export async function getInjectionLogById(id: number): Promise<InjectionLog | null> {
  const db = await getDb();
  return db.getFirstAsync<InjectionLog>(
    'SELECT * FROM peptides_log WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
}

export async function softDeleteInjectionLog(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE peptides_log SET deleted_at = datetime('now') WHERE id = ?",
    [id],
  );
}
