import { getDb, isDbAvailable } from './client';
import type { Schedule } from '@peptpal/core';

export interface CreateScheduleInput {
  peptide_ref_id: number;
  peptide_name: string;
  frequency_hours?: number | null;
  dose_mcg: number;
  start_date: string;
  end_date?: string | null;
  reminder_enabled?: boolean;
}

export async function createSchedule(input: CreateScheduleInput): Promise<number> {
  if (!isDbAvailable()) return 0;
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO schedules
      (peptide_ref_id, peptide_name, frequency_hours, dose_mcg, start_date, end_date, reminder_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.peptide_ref_id,
      input.peptide_name,
      input.frequency_hours ?? null,
      input.dose_mcg,
      input.start_date,
      input.end_date ?? null,
      input.reminder_enabled !== false ? 1 : 0,
    ],
  );
  return result.lastInsertRowId;
}

export async function getSchedules(): Promise<Schedule[]> {
  if (!isDbAvailable()) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<Schedule & { reminder_enabled: number }>(
    'SELECT * FROM schedules WHERE deleted_at IS NULL ORDER BY start_date ASC',
  );
  return rows.map((r) => ({ ...r, reminder_enabled: Boolean(r.reminder_enabled) }));
}

export async function getScheduleById(id: number): Promise<Schedule | null> {
  if (!isDbAvailable()) return null;
  const db = await getDb();
  const row = await db.getFirstAsync<Schedule & { reminder_enabled: number }>(
    'SELECT * FROM schedules WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  if (!row) return null;
  return { ...row, reminder_enabled: Boolean(row.reminder_enabled) };
}

export async function updateScheduleReminder(id: number, reminder_enabled: boolean): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync('UPDATE schedules SET reminder_enabled = ? WHERE id = ?', [
    reminder_enabled ? 1 : 0,
    id,
  ]);
}

export async function softDeleteSchedule(id: number): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(
    "UPDATE schedules SET deleted_at = datetime('now') WHERE id = ?",
    [id],
  );
}
