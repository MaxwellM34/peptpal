/**
 * Backup/restore serialization.
 * Reads all local tables and serializes to JSON for encrypted export.
 */
import { getDb } from './client';

export interface BackupPayload {
  version: number;
  exported_at: string;
  peptides_log: unknown[];
  symptoms_log: unknown[];
  schedules: unknown[];
  inventory: unknown[];
}

export async function exportAllData(): Promise<BackupPayload> {
  const db = await getDb();
  const [peptides_log, symptoms_log, schedules, inventory] = await Promise.all([
    db.getAllAsync('SELECT * FROM peptides_log'),
    db.getAllAsync('SELECT * FROM symptoms_log'),
    db.getAllAsync('SELECT * FROM schedules'),
    db.getAllAsync('SELECT * FROM inventory'),
  ]);
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    peptides_log,
    symptoms_log,
    schedules,
    inventory,
  };
}

export async function importAllData(payload: BackupPayload): Promise<void> {
  const db = await getDb();

  await db.withExclusiveTransactionAsync(async (tx) => {
    // Clear existing data (soft-deleted included — full restore)
    await tx.runAsync('DELETE FROM reminders');
    await tx.runAsync('DELETE FROM symptoms_log');
    await tx.runAsync('DELETE FROM peptides_log');
    await tx.runAsync('DELETE FROM schedules');
    await tx.runAsync('DELETE FROM inventory');

    for (const row of payload.peptides_log as Record<string, unknown>[]) {
      await tx.runAsync(
        `INSERT INTO peptides_log (id, peptide_ref_id, peptide_name, injected_at, dose_mcg,
         dose_ml, injection_site, notes, inventory_id, created_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row['id'], row['peptide_ref_id'], row['peptide_name'], row['injected_at'],
          row['dose_mcg'], row['dose_ml'], row['injection_site'], row['notes'],
          row['inventory_id'], row['created_at'], row['deleted_at'],
        ],
      );
    }

    for (const row of payload.symptoms_log as Record<string, unknown>[]) {
      await tx.runAsync(
        `INSERT INTO symptoms_log (id, peptide_log_id, symptom, severity, occurred_at,
         notes, created_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row['id'], row['peptide_log_id'], row['symptom'], row['severity'],
          row['occurred_at'], row['notes'], row['created_at'], row['deleted_at'],
        ],
      );
    }

    for (const row of payload.schedules as Record<string, unknown>[]) {
      await tx.runAsync(
        `INSERT INTO schedules (id, peptide_ref_id, peptide_name, frequency_hours,
         dose_mcg, start_date, end_date, reminder_enabled, created_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row['id'], row['peptide_ref_id'], row['peptide_name'], row['frequency_hours'],
          row['dose_mcg'], row['start_date'], row['end_date'], row['reminder_enabled'],
          row['created_at'], row['deleted_at'],
        ],
      );
    }

    for (const row of payload.inventory as Record<string, unknown>[]) {
      await tx.runAsync(
        `INSERT INTO inventory (id, peptide_ref_id, peptide_name, vial_count, vial_size_mg,
         reconstituted, bac_water_added_ml, concentration_mcg_per_ml, opened_at, expiry_at,
         storage_location, notes, created_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row['id'], row['peptide_ref_id'], row['peptide_name'], row['vial_count'],
          row['vial_size_mg'], row['reconstituted'], row['bac_water_added_ml'],
          row['concentration_mcg_per_ml'], row['opened_at'], row['expiry_at'],
          row['storage_location'], row['notes'], row['created_at'], row['deleted_at'],
        ],
      );
    }
  });
}
