import { getDb, isDbAvailable } from './client';

export interface ProtocolRow {
  id: number;
  name: string;
  goal: string | null;
  active: boolean;
  created_at: string;
}

export interface ProtocolItemRow {
  id: number;
  protocol_id: number;
  peptide_ref_id: number;
  peptide_name: string;
  peptide_slug: string | null;
  dose_mcg: number;
  doses_per_week: number;
  target_volume_ml: number;
  notes: string | null;
}

export interface CreateProtocolInput {
  name: string;
  goal?: string | null;
  active?: boolean;
  items: Array<Omit<ProtocolItemRow, 'id' | 'protocol_id'>>;
}

export async function createProtocol(input: CreateProtocolInput): Promise<number> {
  if (!isDbAvailable()) return 0;
  const db = await getDb();
  const r = await db.runAsync(
    `INSERT INTO protocols (name, goal, active) VALUES (?, ?, ?)`,
    [input.name, input.goal ?? null, input.active !== false ? 1 : 0],
  );
  const protocolId = r.lastInsertRowId;
  for (const item of input.items) {
    await db.runAsync(
      `INSERT INTO protocol_items
         (protocol_id, peptide_ref_id, peptide_name, peptide_slug, dose_mcg, doses_per_week, target_volume_ml, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        protocolId,
        item.peptide_ref_id,
        item.peptide_name,
        item.peptide_slug ?? null,
        item.dose_mcg,
        item.doses_per_week,
        item.target_volume_ml,
        item.notes ?? null,
      ],
    );
  }
  return protocolId;
}

export async function listProtocols(activeOnly = false): Promise<ProtocolRow[]> {
  if (!isDbAvailable()) return [];
  const db = await getDb();
  const rows = await db.getAllAsync<Omit<ProtocolRow, 'active'> & { active: number }>(
    `SELECT * FROM protocols WHERE deleted_at IS NULL ${activeOnly ? 'AND active = 1' : ''} ORDER BY created_at DESC`,
  );
  return rows.map((r) => ({ ...r, active: Boolean(r.active) }));
}

export async function getProtocolItems(protocol_id: number): Promise<ProtocolItemRow[]> {
  if (!isDbAvailable()) return [];
  const db = await getDb();
  return db.getAllAsync<ProtocolItemRow>(
    `SELECT * FROM protocol_items WHERE protocol_id = ? ORDER BY id ASC`,
    [protocol_id],
  );
}

export async function getActiveProtocolItems(): Promise<
  Array<ProtocolItemRow & { protocolName: string }>
> {
  if (!isDbAvailable()) return [];
  const db = await getDb();
  return db.getAllAsync<ProtocolItemRow & { protocolName: string }>(
    `SELECT pi.*, p.name as protocolName
     FROM protocol_items pi
     JOIN protocols p ON p.id = pi.protocol_id
     WHERE p.active = 1 AND p.deleted_at IS NULL`,
  );
}

export async function setProtocolActive(id: number, active: boolean): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(`UPDATE protocols SET active = ? WHERE id = ?`, [active ? 1 : 0, id]);
}

export async function duplicateProtocol(id: number): Promise<number> {
  if (!isDbAvailable()) return 0;
  const db = await getDb();
  const orig = await db.getFirstAsync<Omit<ProtocolRow, 'active'> & { active: number }>(
    `SELECT * FROM protocols WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
  if (!orig) return 0;
  const items = await getProtocolItems(id);
  return createProtocol({
    name: `${orig.name} (copy)`,
    goal: orig.goal,
    active: false, // duplicates start inactive so user can edit first
    items: items.map((i) => ({
      peptide_ref_id: i.peptide_ref_id,
      peptide_name: i.peptide_name,
      peptide_slug: i.peptide_slug,
      dose_mcg: i.dose_mcg,
      doses_per_week: i.doses_per_week,
      target_volume_ml: i.target_volume_ml,
      notes: i.notes,
    })),
  });
}

export async function softDeleteProtocol(id: number): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(
    `UPDATE protocols SET deleted_at = datetime('now'), active = 0 WHERE id = ?`,
    [id],
  );
}
