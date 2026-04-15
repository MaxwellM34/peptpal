import { getDb, isDbAvailable } from './client';

export interface TutorialState {
  completed: boolean;
  last_step: number;
}

export async function getTutorialState(): Promise<TutorialState | null> {
  if (!isDbAvailable()) return null;
  const db = await getDb();
  const row = await db.getFirstAsync<{ completed: number; last_step: number }>(
    `SELECT completed, last_step FROM tutorial_state WHERE id = 1`,
  );
  if (!row) return null;
  return { completed: Boolean(row.completed), last_step: row.last_step };
}

export async function markTutorialComplete(): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tutorial_state (id, completed, last_step, updated_at)
     VALUES (1, 1, 99, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET completed = 1, updated_at = datetime('now')`,
  );
}

export async function resetTutorial(): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tutorial_state (id, completed, last_step, updated_at)
     VALUES (1, 0, 0, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET completed = 0, last_step = 0, updated_at = datetime('now')`,
  );
}
