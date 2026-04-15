import { getDb, isDbAvailable } from './client';

export interface UserProfile {
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: string | null;
  primary_goal: string | null;
  activity_level: string | null;
}

/**
 * Persona key lives in activity_level for now — avoids a schema migration
 * and the column has no other consumers yet. If activity_level gets its own
 * use later, promote persona to its own column.
 */
export type StoredPersona =
  | 'health_optimizer'
  | 'bodybuilder'
  | 'cautious_beginner'
  | 'risk_tolerant';

export async function getUserProfile(): Promise<UserProfile | null> {
  if (!isDbAvailable()) return null;
  const db = await getDb();
  return db.getFirstAsync<UserProfile>(
    'SELECT weight_kg, height_cm, age, sex, primary_goal, activity_level FROM user_profile WHERE id = 1',
  );
}

export async function upsertUserProfile(input: Partial<UserProfile>): Promise<void> {
  if (!isDbAvailable()) return;
  const db = await getDb();
  const existing = await getUserProfile();
  if (existing) {
    const fields: string[] = [];
    const params: (string | number | null)[] = [];
    for (const [k, v] of Object.entries(input)) {
      fields.push(`${k} = ?`);
      params.push(v as string | number | null);
    }
    fields.push("updated_at = datetime('now')");
    await db.runAsync(`UPDATE user_profile SET ${fields.join(', ')} WHERE id = 1`, params);
  } else {
    await db.runAsync(
      `INSERT INTO user_profile (id, weight_kg, height_cm, age, sex, primary_goal, activity_level)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [
        input.weight_kg ?? null,
        input.height_cm ?? null,
        input.age ?? null,
        input.sex ?? null,
        input.primary_goal ?? null,
        input.activity_level ?? null,
      ],
    );
  }
}
