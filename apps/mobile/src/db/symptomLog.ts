import { getDb } from './client';
import type { SymptomLog } from '@peptpal/core';

export interface CreateSymptomLogInput {
  peptide_log_id?: number | null;
  symptom: string;
  severity: number;
  occurred_at: string;
  notes?: string | null;
}

export async function createSymptomLog(input: CreateSymptomLogInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO symptoms_log (peptide_log_id, symptom, severity, occurred_at, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.peptide_log_id ?? null,
      input.symptom,
      input.severity,
      input.occurred_at,
      input.notes ?? null,
    ],
  );
  return result.lastInsertRowId;
}

export async function getSymptomLogs(opts?: {
  since?: string;
  until?: string;
  limit?: number;
}): Promise<SymptomLog[]> {
  const db = await getDb();
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: (string | number)[] = [];

  if (opts?.since) {
    conditions.push('occurred_at >= ?');
    params.push(opts.since);
  }
  if (opts?.until) {
    conditions.push('occurred_at <= ?');
    params.push(opts.until);
  }

  const where = conditions.join(' AND ');
  const limit = opts?.limit ? `LIMIT ${opts.limit}` : '';
  return db.getAllAsync<SymptomLog>(
    `SELECT * FROM symptoms_log WHERE ${where} ORDER BY occurred_at DESC ${limit}`,
    params,
  );
}

export async function softDeleteSymptomLog(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE symptoms_log SET deleted_at = datetime('now') WHERE id = ?",
    [id],
  );
}
